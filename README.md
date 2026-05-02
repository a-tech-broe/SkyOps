# SkyOps

Aviation tools for GA pilots — Weather · NOTAMs · Airports · Currency

[![CI](https://github.com/a-tech-broe/SkyOps/actions/workflows/ci.yml/badge.svg)](https://github.com/a-tech-broe/SkyOps/actions/workflows/ci.yml)
[![CD](https://github.com/a-tech-broe/SkyOps/actions/workflows/cd.yml/badge.svg)](https://github.com/a-tech-broe/SkyOps/actions/workflows/cd.yml)

---

## Features

- **Weather** — METAR · TAF · PIREPs · SIGMETs · AIRMETs with VFR/MVFR/IFR/LIFR flight rules color coding
- **NOTAMs** — Full text lookup via FAA API
- **Airports** — Info, runways, coordinates, elevation (global ICAO coverage)
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
├── monit/                      # Production monitoring stack
│   ├── docker-compose.yml      # Prometheus · Grafana · Alertmanager · Loki · Promtail · cAdvisor · Blackbox
│   ├── prometheus/             # Scrape configs + alert rules
│   ├── grafana/                # Auto-provisioned datasources + SkyOps dashboard
│   ├── alertmanager/           # Notification routing (Slack / email)
│   ├── loki/                   # Log aggregation config
│   ├── promtail/               # Docker log collector
│   └── blackbox/               # Endpoint uptime probes
└── .github/workflows/
    ├── ci.yml   # PR / dev — lint · scan · build · infra plan
    └── cd.yml   # main    — build · push · infra apply · deploy · monitoring · smoke test
```

---

## Stack

| Layer | Tech |
|---|---|
| Web | React 18 + Vite + Tailwind CSS |
| Mobile | Expo (React Native) + Expo Router |
| API | Node.js 22 + Express + TypeScript + prom-client |
| Database | PostgreSQL 16 |
| Containers | Docker + Docker Compose |
| Infra | Terraform → AWS EC2 (Amazon Linux 2023) + ALB + ACM |
| Monitoring | Prometheus · Grafana · Alertmanager · Loki · Promtail · cAdvisor · Blackbox Exporter |

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
| Deploy monitoring | SCP `monit/` → EC2 → `docker compose up` monitoring stack |
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
| `APP_DOMAIN` | CD — domain for ACM cert and smoke tests (e.g. `skyops.example.com`) |
| `HOSTED_ZONE_ID` | CI/CD — Route53 hosted zone ID for auto DNS validation + A records (optional) |
| `GRAFANA_ADMIN_PASSWORD` | CD — Grafana admin account password |
| `AWS_ACCESS_KEY_ID` | CI infra plan + CD infra apply |
| `AWS_SECRET_ACCESS_KEY` | CI infra plan + CD infra apply |
| `AWS_REGION` | Optional — defaults to `us-east-1` |
| `TF_BACKEND_BUCKET` | Terraform S3 state bucket name |
| `TF_BACKEND_DYNAMO_TABLE` | Terraform DynamoDB lock table name |
| `EC2_HOST` | CD deploy — Elastic IP from `terraform output public_ip` |
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
   ├── /api/*  ──────────────────────────────► EC2 :3001  (Node.js API)
   ├── /health ──────────────────────────────► EC2 :3001
   └── /*  ──────────────────────────────────► EC2 :80    (nginx → React)

EC2 instance (same host, separate Compose project)
   └── :3000  ──── Grafana  (restricted to allowed_ssh_cidr)
```

The EC2 security group accepts ports 80 and 3001 **only from the ALB**. Port 3000 (Grafana) and port 22 (SSH) are restricted to `allowed_ssh_cidr`.

### What gets provisioned

| Resource | Detail |
|---|---|
| EC2 | Amazon Linux 2023, `m5.xlarge`, 20 GB gp3 encrypted |
| ALB | Application Load Balancer — HTTP→HTTPS redirect, path-based routing |
| ACM | TLS certificate for `APP_DOMAIN` + `www.APP_DOMAIN` — DNS validated |
| Internet Gateway | Attached to default VPC, route table managed by Terraform |
| Security groups | ALB SG (80+443 public); EC2 SG (80+3001 from ALB; 22+3000 restricted) |
| IAM role | Least-privilege — SSM read-only scoped to `/skyops/*` |
| Elastic IP | Static address for SSH + Grafana access |

### First-time setup

1. Add all GitHub Secrets listed above
2. Create an EC2 key pair named `keyit` in your AWS account
3. Register a domain and point it at AWS (Route53 recommended)
4. Push to `main` — `cd.yml` provisions everything, deploys the app, and starts monitoring
5. Copy `EC2_HOST` from `terraform output public_ip` → add as GitHub Secret
6. **With Route53 (`HOSTED_ZONE_ID` set):** DNS validation and A records are created automatically
7. **Without Route53:** Check `terraform output acm_validation_records` and add the CNAMEs at your registrar, then re-run the workflow

### DNS without Route53

1. Go to **Actions → latest CD run → Infra Apply → Terraform Outputs**
2. Find `acm_validation_records` — add those CNAMEs at your DNS provider
3. Find `alb_dns_name` — create a CNAME from `APP_DOMAIN` → ALB DNS name
4. Wait for the ACM certificate to reach **Issued** in AWS Console → Certificate Manager
5. Re-run the CD workflow

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

## Monitoring

The `monit/` stack runs as a separate Docker Compose project on the same EC2 instance and is deployed automatically by every CD run.

### Access

| Service | URL |
|---|---|
| Grafana | `http://<EC2_IP>:3000` — login: `admin` / `GRAFANA_ADMIN_PASSWORD` |
| Prometheus | Internal only (`prometheus:9090`) |
| Alertmanager | Internal only (`alertmanager:9093`) |

### What's collected

| Source | Metrics |
|---|---|
| Backend (`/metrics`) | HTTP request rate, latency (p50/p95/p99), error rate — by endpoint |
| Node Exporter | CPU, memory, disk, network, system load |
| cAdvisor | Per-container CPU, memory, restarts |
| Blackbox Exporter | Endpoint uptime probes (backend `/health`, web) |
| Promtail → Loki | All container logs + system logs (30-day retention) |

### Pre-built dashboard

The **SkyOps — App & Infra** dashboard auto-provisions in Grafana under the **SkyOps** folder with panels for:
- Service uptime status
- Request rate by endpoint
- P50 / P95 / P99 latency
- HTTP error rate by status code
- CPU and memory usage
- Disk usage
- Container CPU and memory
- Live backend logs (via Loki)

### Alerts

Alerts are defined in `monit/prometheus/alerts/` and routed through Alertmanager. To activate notifications, edit `monit/alertmanager/alertmanager.yml` and configure a Slack webhook or email receiver.

| Alert | Condition |
|---|---|
| `BackendDown` | Backend unreachable for > 1 min |
| `HighErrorRate` | > 5% of requests returning 5xx for > 2 min |
| `SlowAPIResponse` | P95 latency > 2s on any endpoint for > 5 min |
| `EndpointDown` | Blackbox probe failing for > 2 min |
| `HighCPU` | CPU > 80% for > 5 min |
| `LowMemory` | < 15% memory available for > 5 min |
| `DiskSpaceLow` | < 20% disk remaining |
| `ContainerDown` | backend, web, or db container missing for > 2 min |

---

## Data Sources

| Source | Auth | Data |
|---|---|---|
| [AviationWeather.gov](https://aviationweather.gov/data/api/) | None | METAR, TAF, PIREPs, SIGMETs, AIRMETs, airports (global) |
| [FAA NOTAM API](https://api.faa.gov/) | Client credentials | NOTAMs (US airspace only) |
