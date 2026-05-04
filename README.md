# SkyOps

Aviation tools for GA pilots — Weather · NOTAMs · Airports · Currency

[![CI](https://github.com/a-tech-broe/SkyOps/actions/workflows/ci.yml/badge.svg)](https://github.com/a-tech-broe/SkyOps/actions/workflows/ci.yml)
[![CD](https://github.com/a-tech-broe/SkyOps/actions/workflows/cd.yml/badge.svg)](https://github.com/a-tech-broe/SkyOps/actions/workflows/cd.yml)

> Powered by [ATechBroe](https://atechbroe.com)

---

## Features

- **Weather** — METAR · TAF · PIREPs · SIGMETs · AIRMETs with VFR/MVFR/IFR/LIFR flight rules color coding
- **NOTAMs** — Full text lookup via FAA API
- **Airports** — Info · runways ranked by wind favor · embedded airport diagram · per-runway approach plates · IFR/LIFR alert
- **Search history** — Every ICAO lookup is persisted in Postgres per device; history dropdown appears on all search inputs
- **Light / Dark mode** — Toggle in the nav bar; preference persists across sessions
- **Currency** — DB schema ready for pilot logbook & currency tracking

## Flight Rules

| Color | Category | Ceiling | Visibility |
|---|---|---|---|
| Green | VFR | > 3000 ft | > 5 SM |
| Blue | MVFR | 1000–3000 ft | 3–5 SM |
| Red | IFR | 500–999 ft | 1–3 SM |
| Magenta | LIFR | < 500 ft | < 1 SM |

---

## Airport Details

The Airport page is designed for preflight planning — useful for both student pilots and airline crews.

### Tabs

| Tab | Contents |
|---|---|
| **Overview** | Name, location, elevation, coordinates, longest runway, current METAR, wind direction indicator, IFR/LIFR alert banner |
| **Runways** | Embedded airport diagram (APD) for taxi planning, then all runway ends ranked by wind favor with per-runway approach plate links |
| **Charts** | Full FAA d-TPP chart list grouped by type, linked to current-cycle PDFs |

### Runway Wind Analysis

Runway ends are sorted by how well they align with the reported surface wind. For each end the page shows:

- **HW** — headwind component in knots
- **XW** — crosswind component in knots
- **Best** badge on the most favorable end
- Runway length and surface type (Asphalt, Concrete, Gravel, Turf)

Wind is parsed from the live METAR fetched alongside airport data.

### Embedded Airport Diagram

If an Airport Diagram (APD) exists in the current AIRAC cycle, it is rendered inline at the top of the Runways tab as a scrollable PDF — no need to open a separate tab for taxi routing. A **Full screen** link opens the PDF in a new tab.

### Per-Runway Approach Plates

Each runway end card expands to list every IAP chart whose name references that runway (e.g. `ILS OR LOC RWY 24R`, `RNAV (GPS) Z RWY 24R`). Clicking any plate opens the PDF in a new tab. This means a pilot can see wind favor, surface type, and all available instrument approaches for a specific runway in a single view.

### IFR / LIFR Alert

When the METAR indicates IFR or LIFR conditions **and** the airport has FAA approach plates, a color-coded banner appears in the Overview tab:

| Condition | Banner color |
|---|---|
| IFR | Red |
| LIFR | Magenta |

The banner includes a **View Approaches →** button that jumps to the Charts tab with the Instrument Approaches (IAP) section highlighted.

### FAA d-TPP Charts

Chart data is sourced from the FAA digital Terminal Procedures Publication (d-TPP). Coverage is limited to US airports with ICAO identifiers starting with **K**, **P**, or **A**. International airports display a notice to consult the national AIP or Jeppesen.

| Chart code | Type |
|---|---|
| APD | Airport Diagram |
| IAP | Instrument Approach Procedures |
| DP | Departure Procedures (SIDs) |
| STAR | Standard Terminal Arrivals |
| MIN | Takeoff Minimums & Obstacle Departure Procedures |
| HOT | Airport Hot Spots |

Charts are updated automatically each [AIRAC cycle](https://en.wikipedia.org/wiki/AIRAC) (28-day interval). The current cycle identifier is shown at the top of the Charts tab. The backend caches the d-TPP XML index in memory and clears it on cycle change. If the current cycle index is unavailable on the FAA server, the previous cycle is used as a fallback automatically.

---

## Search History

Every ICAO lookup (Weather, NOTAMs, Airports) is persisted in PostgreSQL tied to an anonymous device UUID stored in `localStorage`. History is per-device and survives browser restarts.

### How it works

1. On first visit the browser generates a UUID and stores it as `skyops_device_id` in `localStorage`
2. Every search fires a background `POST /api/history` with the device ID, ICAO, and search type
3. Clicking any search input fetches `GET /api/history?deviceId=...&type=...` and shows a dropdown of recent lookups (deduplicated by airport, most recent first, top 10)
4. Selecting a history item fills the field and immediately triggers the search

### Database schema

```sql
CREATE TABLE search_history (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id   TEXT NOT NULL,
  icao        TEXT NOT NULL,
  search_type TEXT NOT NULL,   -- 'airport' | 'weather' | 'notam'
  searched_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Repository Layout

```
SkyOps/
├── app/
│   ├── backend/                    # Node.js 22 + Express + TypeScript API + prom-client metrics
│   ├── web/                        # React 18 + Vite + Tailwind CSS (light/dark mode)
│   ├── mobile/                     # Expo (React Native) + Expo Router
│   ├── docker-compose.yml          # Build from source (local prod simulation)
│   └── docker-compose.dev.yml      # Dev with hot reload
├── infra/
│   ├── terraform/                  # AWS — EC2 × 2, ALB, ACM, IAM, SGs (Terraform ≥ 1.8)
│   ├── docker-compose.prod.yml     # App EC2 runtime (web + backend + db)
│   ├── docker-compose.exporters.yml# App EC2 exporters (node-exporter · cAdvisor · Promtail)
│   └── promtail-app.yml            # Promtail config — ships container + system logs to Loki
├── monit/                          # Monitoring EC2 stack
│   ├── docker-compose.yml          # Prometheus · Grafana · Alertmanager · Loki · Blackbox
│   ├── prometheus/                 # Scrape configs + alert rules
│   ├── grafana/                    # Auto-provisioned datasources + SkyOps dashboard
│   ├── alertmanager/               # Notification routing (Slack / email)
│   ├── loki/                       # Log aggregation (30-day retention)
│   └── blackbox/                   # Endpoint uptime probes
└── .github/workflows/
    ├── ci.yml   # PR / dev — lint · scan · build · infra plan
    └── cd.yml   # main    — build · push · infra apply · deploy · exporters · monitoring · smoke test
```

---

## Stack

| Layer | Tech |
|---|---|
| Web | React 18 + Vite + Tailwind CSS (dark mode via class strategy) |
| Mobile | Expo (React Native) + Expo Router |
| API | Node.js 22 + Express + TypeScript + prom-client |
| Database | PostgreSQL 16 |
| Containers | Docker + Docker Compose |
| Infra | Terraform → AWS (2× EC2 m5.xlarge, ALB, ACM, IAM) |
| Monitoring | Prometheus · Grafana · Alertmanager · Loki · Promtail · cAdvisor · node-exporter · Blackbox |

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
| Infra apply | `terraform apply` — provisions EC2 × 2, ALB, ACM, SGs; enforces scrape ingress rules |
| Deploy | SSH → app EC2 — writes `.env` + `docker-compose.prod.yml` → `docker compose up` |
| Deploy exporters | SSH → app EC2 — starts node-exporter, cAdvisor, Promtail (ships logs to Loki) |
| Deploy monitoring | SSH → monitoring EC2 — injects app EC2 IP into prometheus.yml, starts full stack |
| Production smoke test | HTTPS `curl` against `APP_DOMAIN`: `/health`, web HTML, weather and airport endpoints |
| Summary | Release digest table + `cosign verify` instructions |

### GitHub Secrets

| Secret | Used by |
|---|---|
| `DOCKERHUB_USERNAME` | CD — push, sign, deploy |
| `DOCKERHUB_TOKEN` | CD — push |
| `DB_USER` | CD — written to app EC2 `.env` |
| `DB_PASSWORD` | CD — written to app EC2 `.env` |
| `FAA_CLIENT_ID` | CD — written to app EC2 `.env` |
| `FAA_CLIENT_SECRET` | CD — written to app EC2 `.env` |
| `APP_DOMAIN` | CD — ACM cert domain + smoke tests (e.g. `skyops.example.com`) |
| `HOSTED_ZONE_ID` | CI/CD — Route53 hosted zone ID for auto DNS validation + A records (optional) |
| `GRAFANA_ADMIN_PASSWORD` | CD — Grafana admin password |
| `AWS_ACCESS_KEY_ID` | CI infra plan + CD infra apply |
| `AWS_SECRET_ACCESS_KEY` | CI infra plan + CD infra apply |
| `AWS_REGION` | Optional — defaults to `us-east-1` |
| `TF_BACKEND_BUCKET` | Terraform S3 state bucket name |
| `TF_BACKEND_DYNAMO_TABLE` | Terraform DynamoDB lock table name |
| `EC2_HOST` | App server Elastic IP — allocate before first deploy, set as secret |
| `MONITOR_HOST` | Monitoring server Elastic IP — allocate before first deploy, set as secret |
| `EC2_SSH_KEY` | Private key content (PEM) for both EC2s |
| `SEMGREP_APP_TOKEN` | Optional — enables Semgrep cloud dashboard |

---

## Infrastructure

### Architecture

```
Internet
   │
   ▼
Application Load Balancer  (HTTPS :443 — TLS terminated)
   │  HTTP :80 → 301 redirect to HTTPS
   │
   ├── /api/*  ──────► App EC2 :3001  (Node.js API)
   ├── /health ──────► App EC2 :3001
   └── /*      ──────► App EC2 :80    (nginx → React SPA)

App EC2  (m5.xlarge)                    Monitoring EC2  (m5.xlarge)
├── web          :80                    ├── Prometheus      :9090
├── backend      :3001  ◄── scrape ─────┤
├── node-exporter:9100  ◄── scrape ─────┤
├── cAdvisor     :8082  ◄── scrape ─────┤
└── Promtail ────── push logs ─────────►├── Loki            :3100
                                        ├── Grafana         :3000
                                        ├── Alertmanager    :9093
                                        └── Blackbox        (internal)
```

Security groups are locked down: scrape ports (3001, 9100, 8082) on the app EC2 accept traffic **only from the monitoring security group**. Grafana, Prometheus, and Alertmanager on the monitoring EC2 are restricted to `allowed_ssh_cidr`.

### What gets provisioned

| Resource | Detail |
|---|---|
| App EC2 | Amazon Linux 2023, `m5.xlarge`, 20 GB gp3 encrypted |
| Monitoring EC2 | Amazon Linux 2023, `m5.xlarge`, 30 GB gp3 encrypted |
| ALB | Application Load Balancer — HTTP→HTTPS redirect, path-based routing |
| ACM | TLS certificate for `APP_DOMAIN` — DNS validated |
| Internet Gateway | Attached to default VPC |
| Security groups | ALB SG (80+443 public); App SG; Monitoring SG — all with `prevent_destroy` |
| IAM role | Least-privilege — SSM read-only scoped to `/skyops/*` |
| Elastic IPs | Pre-allocated — referenced as data sources, never recreated by Terraform |

All resources use `lifecycle { prevent_destroy = true }` — Terraform will never destroy existing infrastructure.

### First-time setup

1. Allocate two Elastic IPs in your AWS account (one for app, one for monitoring)
2. Set `EC2_HOST` and `MONITOR_HOST` GitHub Secrets to those IPs **before the first run**
3. Create an EC2 key pair named `keyit` in your AWS account
4. Register a domain and point it at AWS (Route53 recommended)
5. Add all remaining GitHub Secrets listed above
6. Push to `main` — the pipeline provisions both servers, deploys the app, and starts the full monitoring stack

**With Route53 (`HOSTED_ZONE_ID` set):** DNS validation and A records are created automatically.

**Without Route53:** Check `terraform output acm_validation_records`, add the CNAMEs at your registrar, then re-run the workflow.

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
```

---

## Monitoring

The app EC2 runs lightweight exporters; a dedicated monitoring EC2 runs the full observability stack. Both are deployed automatically on every CD run.

### Access

| Service | URL | Auth |
|---|---|---|
| Grafana | `http://<MONITOR_HOST>:3000` | `admin` / `GRAFANA_ADMIN_PASSWORD` |
| Prometheus | `http://<MONITOR_HOST>:9090` | None (restricted by SG) |
| Alertmanager | `http://<MONITOR_HOST>:9093` | None (restricted by SG) |

### What's collected

| Source | Location | Data |
|---|---|---|
| Backend `/metrics` | App EC2 :3001 | HTTP request rate, latency (p50/p95/p99), error rate |
| node-exporter | App EC2 :9100 | CPU, memory, disk, network, system load |
| cAdvisor | App EC2 :8082 | Per-container CPU, memory, restarts |
| Blackbox Exporter | Monitoring EC2 | External uptime probes (`/health`, web) |
| Promtail → Loki | App EC2 → Monitoring EC2 | All container logs + system logs (30-day retention) |

### Querying logs in Grafana

Go to **Explore → Loki** and use label selectors:

| Query | What you see |
|---|---|
| `{service="backend"}` | Node.js backend logs |
| `{service="web"}` | Nginx access + error logs |
| `{service="db"}` | Postgres logs |
| `{job="system", host="skyops-app"}` | OS-level logs |
| `{service="backend"} \|= "ERROR"` | Backend errors only |

### Pre-built dashboard

The **SkyOps — App & Infra** dashboard auto-provisions in Grafana with panels for:

- Service uptime status
- Request rate by endpoint
- P50 / P95 / P99 latency
- HTTP error rate by status code
- CPU and memory usage
- Disk usage
- Per-container CPU and memory
- Live backend logs (via Loki)

### Alerts

Alerts are defined in `monit/prometheus/alerts/` and routed through Alertmanager. To enable notifications, edit `monit/alertmanager/alertmanager.yml` and configure a Slack webhook or email receiver.

| Alert | Condition |
|---|---|
| `BackendDown` | Backend unreachable > 1 min |
| `HighErrorRate` | > 5% 5xx responses for > 2 min |
| `SlowAPIResponse` | P95 latency > 2s for > 5 min |
| `EndpointDown` | Blackbox probe failing > 2 min |
| `HighCPU` | CPU > 80% for > 5 min |
| `LowMemory` | < 15% memory available for > 5 min |
| `DiskSpaceLow` | < 20% disk remaining |
| `ContainerDown` | backend, web, or db container missing > 2 min |

---

## Data Sources

| Source | Auth | Data |
|---|---|---|
| [AviationWeather.gov](https://aviationweather.gov/data/api/) | None | METAR, TAF, PIREPs, SIGMETs, AIRMETs, airports (global) |
| [FAA NOTAM API](https://api.faa.gov/) | Client credentials | NOTAMs (US airspace only) |
| [FAA d-TPP](https://aeronav.faa.gov/d-tpp/) | None | Approach plates, airport diagrams, SIDs, STARs (US only, updated each AIRAC cycle) |
