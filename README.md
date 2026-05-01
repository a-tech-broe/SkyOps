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

## Stack

| Layer | Tech |
|---|---|
| Web | React 18 + Vite + Tailwind CSS |
| Mobile | Expo (React Native) + Expo Router |
| API | Node.js 22 + Express + TypeScript |
| Database | PostgreSQL 16 |
| Containers | Docker + Docker Compose |

---

## Quick Start

### Dev

```bash
cp .env.example .env
# fill in FAA_CLIENT_ID and FAA_CLIENT_SECRET
docker compose -f docker-compose.dev.yml up --build
```

| Service | URL |
|---|---|
| Web | http://localhost:5173 |
| API | http://localhost:3001 |
| Mobile | Scan QR from Expo dev server output |

### Production

```bash
cp .env.example .env
# fill in DB_PASSWORD, FAA_CLIENT_ID, FAA_CLIENT_SECRET
docker compose up --build -d
```

| Service | URL |
|---|---|
| Web | http://localhost:80 |
| API | http://localhost:3001 |

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DB_USER` | Yes | PostgreSQL username |
| `DB_PASSWORD` | Yes | PostgreSQL password |
| `FAA_CLIENT_ID` | Yes (NOTAMs) | FAA API client ID — register at [api.faa.gov](https://api.faa.gov/) |
| `FAA_CLIENT_SECRET` | Yes (NOTAMs) | FAA API client secret |
| `VITE_API_URL` | Yes | Backend URL for web build (e.g. `http://localhost:3001`) |
| `EXPO_PUBLIC_API_URL` | Yes | Backend URL for mobile |

---

## CI/CD Pipeline

GitHub Actions runs on every PR and push to `dev`.

### CI (`ci.yml`) — PR / dev branch

| Stage | Tool | Gate |
|---|---|---|
| Secret scan | Gitleaks | Block on secrets |
| Dockerfile lint | Hadolint | Block on errors |
| Type check | TypeScript (`tsc --noEmit`) | Block on type errors |
| Dependency audit | `npm audit` | Block on CRITICAL CVEs |
| SAST | Semgrep | SARIF → Security tab |
| Image build + scan | Docker Buildx + Trivy | Warning (SARIF → Security tab) |

### CD (`cd.yml`) — `main` / tags

All CI gates, plus:

| Stage | Tool |
|---|---|
| Multi-arch image push | DockerHub (`linux/amd64` + `linux/arm64`) |
| Keyless image signing | Cosign (OIDC — no key secrets needed) |
| SBOM generation | Syft / anchore/sbom-action |

### GitHub Secrets required

| Secret | Used by |
|---|---|
| `DOCKERHUB_USERNAME` | CD — push + sign |
| `DOCKERHUB_TOKEN` | CD — push + sign |
| `FAA_CLIENT_ID` | Runtime (NOTAMs) |
| `FAA_CLIENT_SECRET` | Runtime (NOTAMs) |
| `SEMGREP_APP_TOKEN` | CI — optional, enables cloud dashboard |

---

## Data Sources

| Source | Auth | Data |
|---|---|---|
| [AviationWeather.gov](https://aviationweather.gov/data/api/) | None | METAR, TAF, PIREPs, SIGMETs, AIRMETs, airports |
| [FAA NOTAM API](https://api.faa.gov/) | Client credentials | NOTAMs |
