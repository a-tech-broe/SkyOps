#!/bin/bash
set -euo pipefail

# ── Docker ────────────────────────────────────────────────────────
dnf install -y docker
systemctl enable --now docker
usermod -aG docker ec2-user

# ── Docker Compose plugin ─────────────────────────────────────────
mkdir -p /usr/local/lib/docker/cli-plugins
curl -SL "https://github.com/docker/compose/releases/download/v2.27.1/docker-compose-linux-x86_64" \
  -o /usr/local/lib/docker/cli-plugins/docker-compose
chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

# ── App directory ─────────────────────────────────────────────────
mkdir -p /opt/skyops
cd /opt/skyops

# ── Fetch secrets from SSM Parameter Store ────────────────────────
fetch_param() {
  aws ssm get-parameter \
    --name "${ssm_prefix}/$1" \
    --with-decryption \
    --query "Parameter.Value" \
    --output text \
    --region "${aws_region}"
}

DB_PASSWORD=$(fetch_param DB_PASSWORD)
FAA_CLIENT_ID=$(fetch_param FAA_CLIENT_ID)
FAA_CLIENT_SECRET=$(fetch_param FAA_CLIENT_SECRET)
PUBLIC_IP=$(curl -sf http://169.254.169.254/latest/meta-data/public-ipv4 || echo "localhost")

# ── .env ──────────────────────────────────────────────────────────
# $${VAR} escapes to $${VAR} after Terraform rendering; bash expands at runtime
cat > /opt/skyops/.env <<EOF
DB_USER=skyops
DB_PASSWORD=$${DB_PASSWORD}
FAA_CLIENT_ID=$${FAA_CLIENT_ID}
FAA_CLIENT_SECRET=$${FAA_CLIENT_SECRET}
VITE_API_URL=http://$${PUBLIC_IP}:3001
DOCKERHUB_USERNAME=${dockerhub_username}
IMAGE_TAG=${image_tag}
EOF

# ── docker-compose.prod.yml ───────────────────────────────────────
# Written inline so the instance is self-contained (no repo clone needed).
# $${VAR} here renders to $${VAR} in the file; Docker Compose substitutes from .env
cat > /opt/skyops/docker-compose.prod.yml <<'COMPOSE'
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: skyops
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
    image: $${DOCKERHUB_USERNAME}/skyops-backend:$${IMAGE_TAG:-latest}
    restart: unless-stopped
    depends_on:
      db:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_URL: postgresql://$${DB_USER}:$${DB_PASSWORD}@db:5432/skyops
      FAA_CLIENT_ID: $${FAA_CLIENT_ID}
      FAA_CLIENT_SECRET: $${FAA_CLIENT_SECRET}
    ports:
      - "3001:3001"

  web:
    image: $${DOCKERHUB_USERNAME}/skyops-web:$${IMAGE_TAG:-latest}
    restart: unless-stopped
    depends_on:
      - backend
    ports:
      - "80:8080"

volumes:
  pgdata:
COMPOSE

# ── Start containers ──────────────────────────────────────────────
docker compose -f /opt/skyops/docker-compose.prod.yml pull
docker compose -f /opt/skyops/docker-compose.prod.yml up -d

# ── Systemd service (restart on reboot) ───────────────────────────
cat > /etc/systemd/system/skyops.service <<'SERVICE'
[Unit]
Description=SkyOps containers
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/skyops
ExecStart=/usr/bin/docker compose -f /opt/skyops/docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker compose -f /opt/skyops/docker-compose.prod.yml down
TimeoutStartSec=300

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable skyops
