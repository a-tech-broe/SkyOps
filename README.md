# SkyOps

Aviation tools for GA pilots — Weather · NOTAMs · Airports · Currency

[![CI](https://github.com/a-tech-broe/SkyOps/actions/workflows/ci.yml/badge.svg)](https://github.com/a-tech-broe/SkyOps/actions/workflows/ci.yml)
[![CD](https://github.com/a-tech-broe/SkyOps/actions/workflows/cd.yml/badge.svg)](https://github.com/a-tech-broe/SkyOps/actions/workflows/cd.yml)

---

## Features

- **Weather** — METAR · TAF · PIREPs · SIGMETs · AIRMETs with VFR/MVFR/IFR/LIFR flight rules color coding
- **NOTAMs** — Full text lookup via FAA API
- **Airports** — Info, runways, coordinates, elevation
- **Currency** — DB schema ready for pilot logbook & currency tracking

## Flight Rules

| Color | Category | Ceiling | Visibility |
|---|---|---|---|
| Green | VFR | > 3000 ft | > 5 SM |
| Blue | MVFR | 1000–3000 ft | 3–5 SM |
| Red | IFR | 500–999 ft | 1–3 SM |
| Magenta | LIFR | < 500 ft | < 1 SM |

---

## Repository Layout

```
SkyOps/
├── app/
│   ├── backend/                # Node.js 22 + Express + TypeScript API
│   ├── web/                    # React 18 + Vite + Tailwind CSS
│   ├── mobile/                 # Expo (React Native) + Expo Router
│   ├── docker-compose.yml      # Build from source (local prod simulation)
│   └── docker-compose.dev.yml  # Dev with hot reload
├── infra/
│   ├── terraform/              # AWS EC2 + ALB + ACM provisioning (Terraform ≥ 1.6)
│   └── docker-compose.prod.yml # EC2 runtime compose (pre-built DockerHub images)
└── .github/workflows/
    ├── ci.yml   # PR / dev — lint · scan · build · smoke test · infra plan
    └── cd.yml   # main    — build · push · infra apply · deploy · smoke test
```

---

## Stack

| Layer | Tech |
|---|---|
| Web | React 18 + Vite + Tailwind CSS |
| Mobile | Expo (React Native) + Expo Router |
| API | Node.js 22 + Express + TypeScript |
| Database | PostgreSQL 16 |
| Containers | Docker + Docker Compose |
| Infra | Terraform → AWS EC2 (Amazon Linux 2023) + ALB + ACM |

---

## Quick Start

### Dev

```bash
cp app/.env.example app/.env
# fill in FAA_CLIENT_ID and FAA_CLIENT_SECRET
docker compose -f app/docker-compose.dev.yml up --build
```

| Service | URL |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:3001 |
| Mobile | Scan QR from Expo dev server output |

### Production (build from source)

```bash
cp app/.env.example app/.env
# fill in DB_PASSWORD, FAA_CLIENT_ID, FAA_CLIENT_SECRET
docker compose -f app/docker-compose.yml up --build -d
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DB_USER` | Yes | PostgreSQL username |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `FAA_CLIENT_ID` | Yes (NOTAMs) | FAA API client ID — register at [api.faa.gov](https://api.faa.gov/) |
| `FAA_CLIENT_SECRET` | Yes (NOTAMs) | FAA API client secret |
| `VITE_API_URL` | Yes | Backend URL for web build (set to `https://your-domain.com`) |
| `EXPO_PUBLIC_API_URL` | Yes | Backend URL for mobile |

---

## CI/CD Pipeline

Two workflows cover the full DevSecOps lifecycle.

### `ci.yml` — every PR and `dev` push

| Job | Tool | Gate |
|---|---|---|
| Secret scan | Gitleaks (full history) | Blocks |
| Lint & type check | Hadolint + `tsc --noEmit` | Blocks |
| Dependency audit | `npm audit --audit-level=critical` | Blocks |
| SAST | Semgrep | SARIF → Security tab |
| Build & CVE scan | Docker Buildx + Trivy (FS + image) | Warn, SARIF → Security tab |
| Infra plan | `terraform plan` preview | Blocks (PR only) |

### `cd.yml` — merge to `main` / version tags

Runs all security gates, then:

| Job | What happens |
|---|---|
| Build & push | Multi-arch (`amd64` + `arm64`) → DockerHub + Trivy scan + Cosign sign + SBOM |
| Infra apply | `terraform apply` — provisions or updates EC2, ALB, ACM certificate |
| Deploy | SSH → writes `.env` + `docker-compose.prod.yml` → `docker compose pull && up` |
| Production smoke test | HTTPS `curl` against `APP_DOMAIN`: `/health`, web HTML, weather and airport endpoints |
| Summary | Release digest table + `cosign verify` instructions |

### GitHub Secrets

| Secret | Used by |
|---|---|
| `DOCKERHUB_USERNAME` | CD — push, sign, deploy |
| `DOCKERHUB_TOKEN` | CD — push |
| `DB_USER` | CD — written to EC2 `.env` |
| `DB_PASSWORD` | CD — written to EC2 `.env` |
| `FAA_CLIENT_ID` | CD — written to EC2 `.env` |
| `FAA_CLIENT_SECRET` | CD — written to EC2 `.env` |
| `APP_DOMAIN` | CD — domain for ACM cert, VITE_API_URL, and smoke tests (e.g. `skyops.example.com`) |
| `HOSTED_ZONE_ID` | CI/CD — Route53 hosted zone ID for auto DNS validation + A records (optional) |
| `AWS_ACCESS_KEY_ID` | CI infra plan + CD infra apply |
| `AWS_SECRET_ACCESS_KEY` | CI infra plan + CD infra apply |
| `AWS_REGION` | Optional — defaults to `us-east-1` |
| `TF_BACKEND_BUCKET` | Terraform S3 state bucket name |
| `TF_BACKEND_DYNAMO_TABLE` | Terraform DynamoDB lock table name |
| `EC2_HOST` | CD deploy — Elastic IP from `terraform output public_ip` (used for SSH) |
| `EC2_SSH_KEY` | CD deploy — private key content (PEM) |
| `SEMGREP_APP_TOKEN` | Optional — enables Semgrep cloud dashboard |

---

## EC2 + ALB Deployment

Infrastructure is in `infra/terraform/`. Provisioning happens automatically on every merge to `main` via `cd.yml`.

### Architecture

```
Internet
   │
   ▼
Application Load Balancer  (HTTPS :443 — TLS terminated)
   │  HTTP :80 → 301 redirect to HTTPS
   │
   ├── /api/*  ─────────────────────────────► EC2 :3001  (Node.js API)
   ├── /health ─────────────────────────────► EC2 :3001
   └── /*  ─────────────────────────────────► EC2 :80    (nginx → React)
```

The EC2 security group accepts ports 80 and 3001 **only from the ALB** — no direct internet access. SSH (port 22) is restricted to `allowed_ssh_cidr`.

### What gets provisioned

| Resource | Detail |
|---|---|
| EC2 | Amazon Linux 2023, `m5.xlarge`, 20 GB gp3 encrypted |
| ALB | Application Load Balancer — HTTP→HTTPS redirect, path-based routing |
| ACM | TLS certificate for `APP_DOMAIN` + `www.APP_DOMAIN` — DNS validated |
| Internet Gateway | Attached to default VPC, route table managed by Terraform |
| Security groups | ALB SG (80+443 public); EC2 SG (80+3001 from ALB only; 22 restricted) |
| IAM role | Least-privilege — SSM read-only scoped to `/skyops/*` |
| Elastic IP | Static address for SSH, survives stops/restarts |
| Systemd service | Auto-starts containers on reboot once `.env` exists |

### First-time setup

1. Add all GitHub Secrets listed above
2. Create an EC2 key pair named `keyit` in your AWS account
3. Register a domain and point it at AWS (Route53 recommended)
4. Push to `main` — `cd.yml` will provision all infrastructure and deploy the app
5. Copy `EC2_HOST` from `terraform output public_ip` in the workflow run → add as GitHub Secret
6. **With Route53 (`HOSTED_ZONE_ID` set):** DNS validation and A records are created automatically — cert issues in ~2 min
7. **Without Route53:** Check `terraform output acm_validation_records` in the workflow run and add the CNAME records at your registrar, then re-run the workflow once the cert is issued

### DNS without Route53

If your domain is not in Route53, after the first `terraform apply`:

1. Go to **Actions → latest CD run → Infra Apply → Terraform Outputs**
2. Find `acm_validation_records` — add those CNAMEs at your DNS provider
3. Find `alb_dns_name` — create a CNAME from `APP_DOMAIN` → ALB DNS name
4. Wait for the ACM certificate to reach **Issued** status in AWS Console → Certificate Manager
5. Re-run the CD workflow — the HTTPS listener will now work

### Manual infra operations

```bash
cd infra/terraform

terraform init \
  -backend-config="bucket=YOUR_BUCKET" \
  -backend-config="key=ec2/terraform.tfstate" \
  -backend-config="region=us-east-1" \
  -backend-config="dynamodb_table=YOUR_LOCK_TABLE" \
  -backend-config="encrypt=true"

terraform plan   # preview
terraform apply  # provision
terraform destroy # tear down
```

---

## Data Sources

| Source | Auth | Data |
|---|---|---|
| [AviationWeather.gov](https://aviationweather.gov/data/api/) | None | METAR, TAF, PIREPs, SIGMETs, AIRMETs, airports |
| [FAA NOTAM API](https://api.faa.gov/) | Client credentials | NOTAMs |
