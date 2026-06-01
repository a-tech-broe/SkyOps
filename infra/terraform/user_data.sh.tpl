#!/bin/bash
set -euo pipefail
exec > /var/log/skybroe-init.log 2>&1

# ── Docker + Compose plugin (Amazon Linux 2023 repo — no curl needed) ─
dnf install -y docker
systemctl enable --now docker
usermod -aG docker ec2-user

# Install Docker Compose plugin from dnf (AL2023 ships it)
dnf install -y docker-compose-plugin || {
  # Fallback: download binary directly if package unavailable
  mkdir -p /usr/local/lib/docker/cli-plugins
  curl -SL "https://github.com/docker/compose/releases/download/v2.27.1/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
}

# ── App directory ─────────────────────────────────────────────────
mkdir -p /opt/skybroe
chown ec2-user:ec2-user /opt/skybroe

# ── docker-compose.prod.yml ───────────────────────────────────────
# Written here so the instance is self-contained.
# The deploy workflow writes /opt/skybroe/.env before running compose.
# $${VAR} renders to $${VAR} after Terraform; Docker Compose substitutes from .env.
cat > /opt/skybroe/docker-compose.prod.yml <<'COMPOSE'
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: skybroe
      POSTGRES_USER: $${DB_USER}
      POSTGRES_PASSWORD: $${DB_PASSWORD}
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U $${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    image: $${DOCKERHUB_USERNAME}/skybroe-backend:$${IMAGE_TAG:-latest}
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_URL: postgresql://$${DB_USER}:$${DB_PASSWORD}@db:5432/skybroe
      FAA_CLIENT_ID: $${FAA_CLIENT_ID}
      FAA_CLIENT_SECRET: $${FAA_CLIENT_SECRET}
      AWS_REGION: ${aws_region}
      APP_URL: https://${domain_name}
    logging:
      driver: awslogs
      options:
        awslogs-region: ${aws_region}
        awslogs-group: /skybroe/app
        awslogs-stream: backend
        awslogs-create-group: "true"
    ports:
      - "3001:3001"

  web:
    image: $${DOCKERHUB_USERNAME}/skybroe-web:$${IMAGE_TAG:-latest}
    restart: unless-stopped
    depends_on:
      - backend
    logging:
      driver: awslogs
      options:
        awslogs-region: ${aws_region}
        awslogs-group: /skybroe/app
        awslogs-stream: web
        awslogs-create-group: "true"
    ports:
      - "80:8080"

volumes:
  pgdata:
COMPOSE

chown ec2-user:ec2-user /opt/skybroe/docker-compose.prod.yml

# ── Systemd service — starts containers on reboot once .env exists ─
cat > /etc/systemd/system/skybroe.service <<'SERVICE'
[Unit]
Description=SkyBroe containers
After=docker.service network-online.target
Requires=docker.service
ConditionPathExists=/opt/skybroe/.env

[Service]
Type=oneshot
RemainAfterExit=yes
User=ec2-user
WorkingDirectory=/opt/skybroe
ExecStart=/usr/bin/docker compose -f /opt/skybroe/docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f /opt/skybroe/docker-compose.prod.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable skybroe

echo "skybroe-init complete — Docker ready, awaiting first deploy"
