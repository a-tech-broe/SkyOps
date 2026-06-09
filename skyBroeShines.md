# SkyBroe: Competitive Landscape & Differentiators

*How SkyBroe compares to established aviation tools — and where it pulls ahead.*

---

## The Competitive Landscape

The General Aviation EFB (Electronic Flight Bag) and preflight planning market is dominated by a handful of closed, subscription-gated products. Below is an honest look at each major player and what SkyBroe does differently.

---

### ForeFlight

**What it is:** The de facto industry standard for GA pilots in the United States. Subscription-based ($99–$299/yr), iOS/iPad focused. Offers weather, NOTAMs, charts, moving maps, logbook, weight & balance, and ATC route filing.

**Where it falls short:**
- Subscription required — no free tier for core features
- Closed source — no ability to self-host, audit, or extend
- iOS/iPad only as the primary experience — the Android and web versions are limited
- No dispatch-oriented multi-station summary for airline/ops use
- Account required for all features — no anonymous, privacy-first usage
- No DevSecOps transparency — no public SBOM, no signed images, no public CVE history

**SkyBroe vs. ForeFlight:** ForeFlight wins on polish, moving maps, and FAA filing integration. SkyBroe wins on openness, cost ($0), cross-platform support (web + iOS + Android from one codebase), and operational breadth (dispatch strip, multi-station summaries) that ForeFlight does not offer to non-Dispatch subscribers.

---

### Garmin Pilot

**What it is:** Garmin's EFB app, tightly integrated with Garmin avionics (GNS, GTN, G1000 series). Subscription-based (~$75–$150/yr). Weather, charts, flight planning, logbook.

**Where it falls short:**
- Valuable primarily if you fly Garmin-equipped aircraft — standalone value is lower than ForeFlight
- Closed ecosystem — if you don't own Garmin avionics, the integration advantage disappears
- No dispatch or multi-station weather strip
- No self-hosting or open infrastructure
- Account required

**SkyBroe vs. Garmin Pilot:** Garmin Pilot is purpose-built around hardware lock-in. SkyBroe is hardware-agnostic, works in any browser or on any mobile device, and is not dependent on avionics vendor relationships.

---

### FlyQ EFB (Seattle Avionics)

**What it is:** Windows and iOS EFB with charts, weather, and flight planning. Lower price point than ForeFlight (~$50/yr). Strong on Windows desktop which ForeFlight ignores.

**Where it falls short:**
- Windows-first design — web and Android experiences are secondary
- Limited mobile feature parity
- Closed source, no self-hosting
- No dispatch strip, no airline-ops workflows

**SkyBroe vs. FlyQ:** FlyQ fills the Windows/PC gap ForeFlight leaves. SkyBroe is browser-native and works on every platform equally, including Linux, which no commercial EFB supports.

---

### SkyVector

**What it is:** Free web-based flight planning with VFR/IFR sectional charts and weather overlays. Widely used for quick route visualization.

**Where it falls short:**
- No logbook or currency tracking
- No NOTAMs
- No dispatch strip or route briefing
- No mobile app
- No airport detail page (runway analysis, approach plates, density altitude)
- No winds aloft table with ISA deviation
- No self-hosting

**SkyBroe vs. SkyVector:** SkyVector is a chart-and-overlay tool. SkyBroe is a full preflight information system. The two are complementary rather than directly competing, but SkyBroe covers every data dimension SkyVector misses.

---

### aviationweather.gov

**What it is:** The FAA/NOAA raw data portal — free, authoritative, but built for data access, not pilot UX.

**Where it falls short:**
- No formatted presentation — raw text dumps only
- No currency tracking, no dispatch strip, no route briefing
- No airport detail (runway wind analysis, approach plates, density altitude)
- No mobile app
- No search history or session persistence

**SkyBroe vs. aviationweather.gov:** SkyBroe is the UX layer on top of the same authoritative data sources (AviationWeather.gov + FAA APIs). Pilots get the same accuracy with a dramatically better experience.

---

### MyFlightbook

**What it is:** Free, open-source logbook and currency tracker with a web and mobile app. The best-known open-source option in the GA space.

**Where it falls short:**
- Logbook-first — weather, NOTAMs, and airport data are not part of the product
- No dispatch strip
- No real-time weather integration
- No route briefing
- Dated UI — limited responsiveness on mobile

**SkyBroe vs. MyFlightbook:** MyFlightbook handles logbook depth (more flight fields, instructor tracking, endorsements). SkyBroe handles operational situational awareness (weather, NOTAMs, airports, winds, dispatch) and includes currency tracking without requiring an account or logbook entry.

---

### Logten Pro

**What it is:** Premium digital logbook for GA and professional pilots (~$80/yr). Deep logbook, currency tracking, airline-format reports.

**Where it falls short:**
- Logbook only — no weather, no NOTAMs, no dispatch, no airport data
- Expensive for what it does relative to free alternatives
- Closed source

**SkyBroe vs. Logten Pro:** Not direct competitors. Logten Pro is a career logbook tool. SkyBroe covers everything that happens during the preflight and planning phase of a flight — the operational side Logten Pro does not touch.

---

## Where SkyBroe Positively Differentiates

### 1. No Subscription, No Account Required

Every feature in SkyBroe — weather, NOTAMs, airports, winds aloft, route briefing, dispatch strip — works without creating an account. Currency tracking stores data in the browser's `localStorage`. Search history uses an anonymous device UUID. No email, no credit card, no terms-of-service gate.

This is unique in the space. Every commercial competitor requires an account and a subscription for full access.

---

### 2. Open Source and Self-Hostable

SkyBroe is a containerized monorepo that any pilot, flight school, airline, or ops center can run on their own infrastructure. A `docker compose up` in the `app/` directory brings up the full stack: React web app, Node.js API, and PostgreSQL database.

No commercial EFB offers this. ForeFlight, Garmin Pilot, FlyQ, and FltPlan Go are all closed SaaS products. SkyBroe is inspectable, forkable, and deployable on hardware you control.

---

### 3. DevSecOps Pipeline — Rare in Aviation Software

The CI/CD pipeline runs a layered security stack on every pull request and every merge to `main`:

| Gate | Tool | What it catches |
|---|---|---|
| Secret scanning | Gitleaks (full history) | Committed credentials, API keys |
| Dockerfile lint | Hadolint | Insecure Dockerfile patterns |
| Type safety | TypeScript (`tsc --noEmit`) | Type errors before runtime |
| Dependency audit | `npm audit` | Known CVEs in dependencies |
| SAST | Semgrep | Code-level security patterns |
| Container CVE scan | Trivy (FS + image) | OS/library CVEs in built images |
| Multi-arch build | Docker Buildx | `amd64` + `arm64` parity |
| Image signing | Cosign (keyless) | Supply chain integrity |
| SBOM generation | Trivy | Software bill of materials |
| Infra preview | `terraform plan` | Infrastructure drift on every PR |

Aviation software rarely publishes its security posture. SkyBroe makes the entire pipeline public and gates production deploys on passing all scans. Operators can verify signed images and review the SBOM before running the app on any system.

---

### 4. Broader Audience: GA, Students, Airlines, and Dispatch

Most EFBs target the GA private pilot. SkyBroe is designed for three distinct user groups:

| Role | Tools available |
|---|---|
| Student pilot | Currency tracker (FAR 61.56/61.57), weather briefing, airport info, METAR/TAF reading |
| GA pilot | All of the above + route briefing, winds aloft, NOTAMs, density altitude, runway wind analysis, approach plates |
| Airline crew / dispatcher | Dispatch strip (multi-station parallel weather), route briefing, SIGMET/AIRMET awareness |

No single commercial EFB covers all three roles. ForeFlight skews GA. Dispatch products (Jeppesen FliteDeck Pro, ACARS systems) target airline ops at enterprise price points and are inaccessible to independent operators and small charter companies. SkyBroe unifies both in a free, open tool.

---

### 5. Per-Runway Approach Plate Integration with Wind Analysis

SkyBroe's airport runway tab is a unique combination that no competitor presents in a single view:

- Runway ends ranked by wind favor (headwind and crosswind components calculated from live METAR)
- Best-end badge for the most favorable runway alignment
- Runway surface type (Asphalt, Concrete, Gravel, Turf) and length per end
- Every IAP approach plate for that specific runway end, listed inline and linked directly to the current-AIRAC-cycle PDF

A pilot can see in one screen: which runway to use given the wind, what instrument approaches are available for that runway, and open the plate directly — without switching apps or tabs. ForeFlight requires navigating to a separate charts section. SkyVector has no approach plates. aviationweather.gov has no runway analysis.

---

### 6. Embedded Airport Diagram on the Runway Tab

If an Airport Diagram (APD) exists for the airport in the current AIRAC cycle, it renders as a scrollable inline PDF at the top of the Runways tab. No need to open a separate chart viewer for taxi routing while simultaneously reading the runway wind analysis. A full-screen link opens it in a new tab when needed.

---

### 7. AIRAC-Cycle-Aware Chart Caching with Automatic Fallback

The backend caches the FAA d-TPP chart index in memory and resets it automatically on each AIRAC cycle boundary (every 28 days). If the current cycle's index is not yet published on the FAA server, the previous cycle is used as a fallback — transparently, without pilot intervention. The current cycle identifier is shown on the Charts tab so pilots always know which cycle's data they are viewing.

---

### 8. Winds Aloft with ISA Temperature Deviation

The Winds Aloft page parses the full FAA FD text format — including the high-speed encoding convention where direction codes above 36 indicate 100+ knot winds — and presents it as a formatted table with an ISA deviation column.

ISA deviation (actual temperature minus standard atmosphere temperature at each altitude) tells the pilot whether density altitude is higher or lower than indicated altitude at each flight level. No other free tool surfaces this in a formatted, color-coded table.

---

### 9. Density Altitude Calculator Embedded in Airport Overview

Enter the altimeter setting and OAT directly on the airport page — no external calculator needed. Output is color-coded (green below 5,000 ft DA, orange above, red above 8,000 ft) and flags a performance warning when density altitude exceeds field elevation by more than 2,000 ft. Student pilots learning high-density-altitude operations and GA pilots flying mountain airports have this data one click from the airport lookup.

---

### 10. Nearby Alternates with Live METARs, In-App

The airport Overview tab can load up to 8 airports within 50 nautical miles, sorted by distance, each with its current METAR — without leaving the page. Tapping an alternate immediately searches that airport. This directly supports FAR 91.169 alternate planning and FAR 121 alternate requirements without switching to a separate tool or manually querying each airport.

---

### 11. Native Mobile App (iOS + Android) from the Same Codebase

SkyBroe ships a React Native / Expo mobile app targeting both iOS and Android from a single codebase — built alongside the web app in the same monorepo. The mobile UI uses a horizontal swipe-pager with a fixed tab strip and a fully responsive layout hook that adapts font sizes, grid columns, touch targets, and content widths for phones in portrait and landscape, and iPads in both orientations.

Commercial competitors either prioritize one platform (ForeFlight on iPad) or maintain separate native codebases. SkyBroe achieves cross-platform mobile coverage with no additional platform team.

---

### 12. Full Infrastructure as Code (Terraform on AWS)

The `infra/terraform/` directory provisions the complete AWS environment — EC2, Application Load Balancer, ACM TLS certificate, Security Groups, IAM roles, and Route53 DNS — in a reproducible, version-controlled way. Every infrastructure change is previewed via `terraform plan` on each PR before it can reach production.

No commercial EFB publishes their infrastructure. For operators running SkyBroe privately (flight schools, charter companies, airlines) this means the entire deployment is auditable, portable, and rebuildable from scratch in a single `terraform apply`.

---

## Summary Comparison Table

| Capability | SkyBroe | ForeFlight | Garmin Pilot | SkyVector | MyFlightbook |
|---|:---:|:---:|:---:|:---:|:---:|
| Free (no subscription) | Yes | No | No | Partial | Yes |
| No account required | Yes | No | No | Yes | No |
| Open source | Yes | No | No | No | Yes |
| Self-hostable | Yes | No | No | No | Partial |
| Web app | Yes | Limited | No | Yes | Yes |
| iOS app | Yes | Yes | Yes | No | Yes |
| Android app | Yes | Limited | No | No | Yes |
| METAR / TAF | Yes | Yes | Yes | Yes | No |
| NOTAMs | Yes | Yes | Yes | No | No |
| PIREPs / SIGMETs / AIRMETs | Yes | Yes | Yes | Partial | No |
| Winds aloft + ISA deviation | Yes | Yes | Yes | No | No |
| Route briefing strip | Yes | Yes | Yes | No | No |
| Dispatch multi-station strip | Yes | No (paid add-on) | No | No | No |
| Runway wind analysis | Yes | Yes | Yes | No | No |
| Per-runway approach plates inline | Yes | No | No | No | No |
| Embedded airport diagram | Yes | No | No | No | No |
| Density altitude calculator | Yes | Yes | Yes | No | No |
| Nearby alternates with METARs | Yes | Yes | Yes | No | No |
| AIRAC-cycle chart caching + fallback | Yes | Yes | Yes | No | No |
| FAR 61 currency tracker | Yes | Yes | Yes | No | Yes |
| DevSecOps pipeline (public) | Yes | No | No | No | No |
| Signed container images + SBOM | Yes | No | No | No | No |
| Infrastructure as Code (public) | Yes | No | No | No | No |

---

## The Core Proposition

SkyBroe is not trying to replace ForeFlight for the pilot who needs moving maps and ATC filing. It occupies a distinct, underserved position:

- **Free and open** in a market of $100–$300/yr subscriptions
- **Self-hostable** for operators who need data sovereignty (flight schools, charter ops, airlines)
- **Broader audience** — GA + students + airline dispatch in one tool, no separate products
- **Operationally transparent** — public pipeline, signed images, public SBOM, public IaC
- **No account wall** — situational awareness should not require a login

For any operator, institution, or pilot who values openness, auditability, or cost, SkyBroe is the only product in this class that delivers.
