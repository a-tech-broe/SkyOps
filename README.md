# SkyOps

Aviation tools for GA pilots — Weather · NOTAMs · Airports · Currency

## Stack

| Layer | Tech |
|---|---|
| Web | React 18 + Vite + Tailwind CSS |
| Mobile | Expo (React Native) + Expo Router |
| API | Node.js + Express + TypeScript |
| Database | PostgreSQL 16 |
| Containers | Docker + Docker Compose |

## Quick Start (Dev)

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build
```

- Web: http://localhost:5173
- API: http://localhost:3001
- Mobile: scan QR from Expo dev server output

## Production

```bash
cp .env.example .env
# fill in DB_PASSWORD, FAA_CLIENT_ID, FAA_CLIENT_SECRET
docker compose up --build -d
```

- Web: http://localhost:80
- API: http://localhost:3001

## API Keys

| Service | Required | Notes |
|---|---|---|
| AviationWeather.gov | No | Free, no key |
| FAA NOTAM API | Yes (for NOTAMs) | Register at https://api.faa.gov/ |

## Features

- **Weather**: METAR · TAF · PIREPs with VFR/MVFR/IFR/LIFR flight rules
- **NOTAMs**: Full text via FAA API
- **Airports**: Info, runways, coordinates, elevation
- **Database**: Schema ready for pilot logbook & currency tracking (auth coming)

## Flight Rules Color Coding

| Color | Category | Ceiling | Visibility |
|---|---|---|---|
| Green | VFR | > 3000 ft | > 5 SM |
| Blue | MVFR | 1000–3000 ft | 3–5 SM |
| Red | IFR | 500–999 ft | 1–3 SM |
| Magenta | LIFR | < 500 ft | < 1 SM |
