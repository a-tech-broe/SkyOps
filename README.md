# SkyOps

Aviation tools for student pilots, airline crews, and flight ops/dispatch — Weather · NOTAMs · Airports · Winds · Briefing · Currency · Dispatch

[![CI](https://github.com/a-tech-broe/SkyOps/actions/workflows/ci.yml/badge.svg)](https://github.com/a-tech-broe/SkyOps/actions/workflows/ci.yml)
[![CD](https://github.com/a-tech-broe/SkyOps/actions/workflows/cd.yml/badge.svg)](https://github.com/a-tech-broe/SkyOps/actions/workflows/cd.yml)

> Powered by [ATechBroe](https://atechbroe.com)

---

## Features

| Page | Who it's for | Summary |
|---|---|---|
| **Weather** | All | METAR · TAF · PIREPs · SIGMETs · AIRMETs with VFR/MVFR/IFR/LIFR color coding |
| **NOTAMs** | All | Full text lookup via FAA API |
| **Airports** | All | Info · runways · charts · sunrise/sunset · density altitude · frequencies · nearby alternates |
| **Winds Aloft** | All | FD winds forecast table with ISA temperature deviation |
| **Route Briefing** | GA / airlines | DEP → DEST → ALT preflight strip — METAR, TAF, NOTAM count per station |
| **Currency** | GA / student | FAR 61 currency tracker — VFR day/night, IFR, flight review — stored on-device |
| **Dispatch** | Airlines / ops | Multi-station weather summary table for route planning and flight release |
| **Search history** | All | Every ICAO lookup persisted in Postgres per device; dropdown on all search inputs |
| **Light / Dark mode** | All | Toggle in nav bar; preference persists |

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
| **Overview** | Name · location · elevation · longest runway · METAR · wind indicator · IFR/LIFR alert · sunrise/sunset (UTC) · frequencies · density altitude calculator · nearby alternates (50 nm) |
| **Runways** | Embedded airport diagram (APD) for taxi planning · runway ends ranked by wind favor · headwind/crosswind components · per-runway IAP approach plate links |
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

### Sunrise & Sunset

The Overview tab computes today's sunrise, solar noon, and sunset times in UTC using the NOAA solar calculator algorithm — no API call required. Useful for planning night currency flights or checking civil twilight for passenger carrying.

### Density Altitude Calculator

Enter the current altimeter setting (in Hg) and OAT (°C) to compute density altitude on the spot. Color-coded output: green below 5,000 ft, orange above 5,000 ft, red above 8,000 ft. A performance warning appears when DA is more than 2,000 ft above field elevation.

### Nearby Alternates

Click **Load** in the Overview tab to fetch up to 8 airports within 50 nm, sorted by distance, each with its current METAR. Clicking an alternate ICAO immediately searches that airport. Useful for alternate planning under FAR 91.169 / FAR 121.

---

## Winds Aloft

The Winds Aloft page fetches the FAA FD 6-hour forecast for any US station and displays a formatted table:

| Column | Detail |
|---|---|
| Altitude | 3,000 ft through FL390 |
| Direction | Degrees magnetic (000–360); "L & V" for light and variable |
| Speed | Knots; red ≥ 50 kt, orange ≥ 30 kt |
| Temp (°C) | Blue below −40°C, orange above +5°C |
| ISA Dev | Actual temp − standard atmosphere temp at that altitude; orange = warmer than ISA (DA higher than indicated) |

FD winds use 3-letter station identifiers (K-prefix stripped). The parser handles the full FD text format including the high-speed encoding (DD > 36 → subtract 50, add 100 kts).

---

## Route Briefing

Enter a departure, destination, and optional alternate ICAO to generate a preflight briefing strip. Each station card shows:

- Flight rules category (VFR / MVFR / IFR / LIFR)
- Raw METAR
- Full TAF (pre-formatted)
- NOTAM count badge

Data for all stations is fetched in parallel. Useful as a quick "one-page" preflight awareness check before pulling a full ATC briefing.

---

## Currency Tracker

Tracks FAR 61 recency requirements — stored entirely in the browser (`localStorage`), no account required.

| Requirement | FAR | Rule |
|---|---|---|
| Day VFR (pax) | 61.57(a) | 3 takeoffs & landings in preceding 90 days |
| Night VFR (pax) | 61.57(b) | 3 full-stop night landings in preceding 90 days |
| IFR | 61.57(c) | 6 instrument approaches + hold + intercept/track in preceding 6 calendar months |
| Flight Review | 61.56 | 1 hr ground + 1 hr flight in preceding 24 calendar months |

Each currency card shows the current count, a color-coded status badge (current / not current), and days until expiry or days since expiry. A flight log table tracks individual entries (date, aircraft, day/night landings, approaches, holding). The last flight review or IPC date is stored separately.

---

## Mobile App

The native mobile app (Expo / React Native) targets iOS and Android and is optimised for everyday use on the flight line — no browser required.

### Screens

| Screen | What it does |
|---|---|
| **Weather** | ICAO METAR lookup — wind, visibility, altimeter, temp/dew, cloud layers, flight rules badge (VFR / MVFR / IFR / LIFR), raw METAR string |
| **NOTAMs** | ICAO NOTAM lookup via FAA API — number, effective dates, full text |
| **Airports** | ICAO airport lookup — elevation, lat/lon, longest runway, runway directions |

### Navigation

Screens are laid out as a **horizontal swipe-pager**: swipe left or right to move between Weather → NOTAMs → Airports. The tab strip at the top stays fixed — it scrolls independently from the content panels and never moves when you scroll within a screen. Tapping a tab label jumps to that panel; the sliding indicator bar tracks the active page.

### Responsive layout

The `useLayout()` hook drives every size value (font, padding, border radius, touch targets, grid columns) and re-runs automatically on orientation change. The pager re-snaps to the correct page after rotation so no content is lost.

| Device class | Stat grid | Font scale | Content width |
|---|---|---|---|
| Phone portrait | 2 columns | base | full width |
| Phone landscape | 3 columns | base | full width |
| iPad portrait | 3 columns | +2 pt | max 720 px centred |
| iPad landscape | 4 columns | +2 pt | max 720 px centred |

### Running the mobile app

```bash
cd app/mobile
npm install
npx expo start          # opens Metro — scan QR with Expo Go on device
npx expo start --ios    # or --android for simulator
```

Set `EXPO_PUBLIC_API_URL` in `app/mobile/.env` (or export it) to point at the running backend before launching.

---

## Dispatch Strip

Enter any number of ICAO codes (space or comma-separated) to get a parallel weather pull for all stations simultaneously. Each station is summarized in a single row:

| Field | Source |
|---|---|
| Category | VFR / MVFR / IFR / LIFR derived from METAR |
| Wind | Direction @ speed (with gust if reported) |
| Vis | Statute miles |
| Ceiling | Lowest BKN or OVC layer |
| Temp/Dew | °C / °C |
| Altimeter | Inches Hg |

On mobile, stations render as stacked cards instead of a table. Useful for airline dispatcher route planning, multi-leg charter ops, or checking a string of alternates.

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
│   ├── mobile/                     # Expo (React Native) — single-screen horizontal pager
│   ├── docker-compose.yml          # Build from source (local prod simulation)
│   └── docker-compose.dev.yml      # Dev with hot reload
├── infra/
│   ├── terraform/                  # AWS — EC2 × 2, ALB, ACM, IAM, SGs (Terraform ≥ 1.8)
│   ├── docker-compose.prod.yml     # App EC2 runtime (web + backend + db)
│   ├── docker-compose.exporters.yml# App EC2 exporters (node-exporter · cAdvisor · Promtail)
│   └── promtail-app.yml            # Promtail config — Docker SD + system logs → Loki (private IP)
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
| Mobile | Expo (React Native) + Expo Router — custom horizontal pager, fully responsive (phone · tablet · landscape) |
| API | Node.js 22 + Express + TypeScript + prom-client · geoip-lite · ua-parser-js |
| Database | PostgreSQL 16 |
| Containers | Docker + Docker Compose |
| Infra | Terraform → AWS (2× EC2 m5.xlarge, ALB, ACM, IAM) |
| Monitoring | Prometheus · Grafana · Alertmanager · Loki · Promtail · cAdvisor · node-exporter · Blackbox |

---

## Quick Start

### Dev

```bash
# Copy and fill in your env vars
cp .env .env.local           # or create app/.env from scratch
# Required: FAA_CLIENT_ID, FAA_CLIENT_SECRET, DB_USER, DB_PASSWORD

docker compose -f app/docker-compose.dev.yml up --build
```

| Service | URL / method |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:3001 |
| Mobile | `cd app/mobile && npx expo start` — scan QR with Expo Go |

### Production (build from source)

```bash
# Required: DB_PASSWORD, FAA_CLIENT_ID, FAA_CLIENT_SECRET
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
| Infra apply | `terraform apply` — provisions EC2 × 2, ALB, ACM, SGs; outputs private IPs for both instances |
| Deploy | SSH → app EC2 — writes `.env` + `docker-compose.prod.yml` → `docker compose up` |
| Deploy exporters | SSH → app EC2 — writes `.env` with Loki private IP; starts node-exporter, cAdvisor, Promtail |
| Deploy monitoring | SSH → monitoring EC2 — writes `.env` with app EC2 private IP + domain; starts full stack |
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
├── backend      :3001  ◄─ private IP ──┤   (scrapes via VPC private IPs)
├── node-exporter:9100  ◄─ private IP ──┤
├── cAdvisor     :8082  ◄─ private IP ──┤
└── Promtail ──── push (private IP) ───►├── Loki            :3100
                                        ├── Grafana         :3000
                                        ├── Alertmanager    :9093
                                        └── Blackbox        (internal)
```

Security groups are locked down: scrape ports (3001, 9100, 8082) on the app EC2 accept traffic **only from the monitoring security group**. Loki (port 3100) on the monitoring EC2 accepts traffic from the VPC CIDR only — Promtail connects via the monitoring EC2's **private IP**. Prometheus scrapes the app EC2 via its **private IP** as well. Grafana, Prometheus, and Alertmanager are restricted to `allowed_ssh_cidr`.

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
| Prometheus | `http://<MONITOR_HOST>:9090` | None (restricted by SG to `allowed_ssh_cidr`) |
| Alertmanager | `http://<MONITOR_HOST>:9093` | None (restricted by SG to `allowed_ssh_cidr`) |
| Loki | VPC-internal only — not exposed publicly | Accessible via Grafana datasource |

### What's collected

| Source | Location | Data |
|---|---|---|
| Backend `/metrics` | App EC2 :3001 | HTTP request rate, latency (p50/p95/p99), error rate |
| Backend request logs | App EC2 stdout → Loki | Structured JSON per request: method, path, status, duration_ms, country, region, city, browser, OS, device type |
| node-exporter | App EC2 :9100 | CPU, memory, disk, network, system load |
| cAdvisor | App EC2 :8082 | Per-container CPU, memory, restarts |
| Blackbox Exporter | Monitoring EC2 | External uptime probes (`/health`, web) |
| Promtail → Loki | App EC2 → Monitoring EC2 (private IP) | All container logs + system logs (30-day retention) |

### Querying logs in Grafana

The Loki datasource is auto-provisioned in Grafana at `http://loki:3100` — this is Docker's internal DNS name for the Loki container (both run on the `monit` network). The URL is correct as-is; Grafana queries Loki server-side.

Go to **Explore → Loki** and use label selectors:

| Query | What you see |
|---|---|
| `{service="backend"}` | Node.js backend logs |
| `{service="web"}` | Nginx access + error logs |
| `{service="db"}` | Postgres logs |
| `{job="system", host="skyops-app"}` | OS-level logs |
| `{service="backend"} \|= "ERROR"` | Backend errors only |
| `{container=~".+"}` | All container logs |

Backend logs are structured JSON — each line is a request record. Useful LogQL expressions:

| Query | What you see |
|---|---|
| `{service="backend"} \| json \| status >= 500` | Server errors |
| `{service="backend"} \| json \| country = "US"` | US traffic only |
| `{service="backend"} \| json \| device = "mobile"` | Mobile client requests |
| `{service="backend"} \| json \| duration_ms > 1000` | Slow requests (> 1 s) |

The `service` label is sourced from the Docker Compose `com.docker.compose.service` container label via Promtail's Docker SD (`__meta_docker_container_label_com_docker_compose_service`).

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

### Debugging the monitoring stack

Check service status and logs on the monitoring EC2:

```bash
# Are all containers up?
sudo docker compose -f /opt/monit/docker-compose.yml ps

# Loki startup logs (most likely to fail — see notes below)
sudo docker compose -f /opt/monit/docker-compose.yml logs loki --tail=40

# Prometheus config after entrypoint sed substitution
sudo docker compose -f /opt/monit/docker-compose.yml exec prometheus cat /tmp/prometheus.yml

# Verify Loki is ready
curl -s http://localhost:3100/ready

# Check what log streams Loki has ingested
curl -s http://localhost:3100/loki/api/v1/labels
```

Check Promtail on the app EC2:

```bash
sudo docker compose -f /opt/exporters/docker-compose.yml logs promtail --tail=40
```

**Known gotchas:**

| Component | Issue | Fix |
|---|---|---|
| Loki | Crashes on startup with retention enabled | `compactor.delete_request_store: filesystem` is required in `loki.yml` when `retention_enabled: true` (Loki 2.9.x) |
| Loki | Volume permission errors | Service runs as `user: "0"` (root) to avoid UID mismatch with named volume |
| cAdvisor | Fails to start on Amazon Linux 2023 | `devices: /dev/kmsg` removed — device doesn't exist on AL2023 |
| Prometheus | Targets show as down | Scrapes via **private IP** (not public EIP) — Terraform outputs `app_private_ip` and it's injected via `.env` at deploy time |
| Promtail | Logs not reaching Loki | Pushes to Loki's **private IP** (port 3100 is VPC-only in the SG); `-config.expand-env=true` required to expand `${LOKI_URL}` |
| Promtail | `service` label empty in Loki | Docker SD labels use `__meta_docker_container_label_com_docker_compose_service`, not `__meta_docker_compose_service` |

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
| [AviationWeather.gov](https://aviationweather.gov/data/api/) | None | METAR, TAF, PIREPs, SIGMETs, AIRMETs, airports (global), winds aloft FD text |
| [FAA NOTAM API](https://api.faa.gov/) | Client credentials | NOTAMs (US airspace only) |
| [FAA d-TPP](https://aeronav.faa.gov/d-tpp/) | None | Approach plates, airport diagrams, SIDs, STARs (US only, updated each AIRAC cycle) |

### Backend API Endpoints

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/weather/metar/:icao` | METAR JSON |
| `GET` | `/api/weather/taf/:icao` | TAF JSON |
| `GET` | `/api/weather/pireps/:icao` | PIREPs within 100 SM |
| `GET` | `/api/weather/sigmets` | Active SIGMETs |
| `GET` | `/api/notams/:icao` | NOTAMs (FAA API) |
| `GET` | `/api/airports/:icao` | Airport info + merged METAR |
| `GET` | `/api/airports/:icao/charts` | FAA d-TPP charts for AIRAC cycle |
| `GET` | `/api/airports/:icao/alternates?radius=50` | Nearby airports within radius nm with METARs |
| `GET` | `/api/winds/:icao` | Parsed FD winds aloft for station |
| `GET` | `/api/history?deviceId=&type=` | Recent ICAO searches for device |
| `POST` | `/api/history` | Record a search event |
| `GET` | `/health` | Health check |
| `GET` | `/metrics` | Prometheus metrics |
