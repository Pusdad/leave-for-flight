# Leave By

iPhone home-screen PWA: type a flight number and date, get a **leave-the-house** time.

Built for Scott Jacobs (Dallas / Rockwall, `America/Chicago`). No Heilind / ICC branding.

`leave_by = boarding_time − tsa_wait − drive_time − parking_buffer`

`boarding_time` is the airline’s posted boarding time when the lookup returns one; otherwise `departure − boarding_lead`.

---

## Add to Home Screen (iPhone)

1. Deploy the app over **HTTPS** (GitHub Pages or Vercel). iOS will not install a PWA from a raw `file://` page.
2. Open the URL in **Safari** (not Chrome).
3. Tap the **Share** button.
4. Tap **Add to Home Screen**.
5. Leave the name as **Leave By**, tap **Add**.

The home-screen icon is `icons/apple-touch-icon.png` (180×180). The app opens standalone, with a black theme and safe-area insets.

---

## Run locally

```bash
npm start          # http://localhost:3000  (static PWA + /api/*)
npm test           # leave-by example + parser tests
```

Or serve the static files only:

```bash
npx --yes serve .
```

The form always works with **manual** origin airport, departure time, drive minutes, and TSA minutes. You do not need API keys.

### Documented example (no keys)

Fill **Overrides & buffers** with:

| Field | Value |
| --- | --- |
| Origin | `DFW` |
| Departure | `10:00` |
| Drive minutes | `35` |
| TSA minutes | `12` |
| Parking / walk | `15` (default) |
| Boarding lead | `30` (default domestic) |

**Leave by = 8:28 AM.**

Boarding is 9:30. Then `9:30 − 12 − 35 − 15 = 8:28`.

Shortcut: open `/?example=1` and tap **Leave by…**. That fills the manual fields only (no invented flight).

Automated check: `npm test` (same numbers).

---

## Deploy

### GitHub Pages = UI + manual / OSRM path

Pages cannot run the `/api/flight` or `/api/tsa` proxies.

- After this lands on `main`, enable **Settings → Pages → GitHub Actions** (the workflow in `.github/workflows/pages.yml` deploys the static shell).
- Or: **Settings → Pages → Deploy from a branch → `main` / root**. Add a `.nojekyll` file is already in the repo.

On Pages:

- Enter airport + departure + TSA minutes yourself.
- Drive time uses the browser’s geolocation and public **OSRM** (`router.project-osrm.org`) when CORS allows, labeled **no live traffic**. You can always type drive minutes.
- Flight lookup will show **“couldn’t look that flight up”** and keep the manual fields. The app does not go blank.

Site URL will be `https://<user>.github.io/leave-for-flight/` for this project repo.

### Vercel = live flight + TSA proxy (recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Pusdad/leave-for-flight)

One-click (or `npx vercel`): the `/api/flight`, `/api/tsa`, and `/api/drive` functions run on Vercel’s free tier. No VPS.

Optional env vars (Project → Settings → Environment Variables):

| Variable | Used for |
| --- | --- |
| `AVIATIONSTACK_API_KEY` | Flight lookup (Aviationstack `/v1/flights`) |
| `AERODATABOX_KEY` | Flight lookup (AeroDataBox RapidAPI, tried if Aviationstack fails or is unset) |
| `GOOGLE_MAPS_API_KEY` | Live-traffic drive time via Distance Matrix (`/api/drive` only) |

**Never put keys in the client.** `.env` is gitignored. Copy `.env.example` for local use.

Without keys, Vercel still serves the UI and the TSA proxy (FlyIndex scrape). Flight lookup still fails closed to the manual path.

---

## What the app does

**Inputs**

- Flight number (`AA1234`) and travel date (defaults to today in `America/Chicago`)
- Optional overrides: origin airport, departure time, drive minutes, TSA minutes
- TSA PreCheck toggle
- Parking / walk-to-checkpoint buffer (default **15** min)
- Boarding lead if the airline did not post one (default **30** domestic / **45** international)

**Outputs** (large, glanceable)

- **Leave by** in the phone’s local time, plus a countdown
- Breakdown: departure → boarding → TSA → drive (live traffic / no live traffic) → parking
- Flight summary: airline, origin + terminal when known, scheduled vs estimated departure, boarding if posted
- If the flight is delayed, **estimated** departure is used, not scheduled
- **Open in Apple Maps** is a convenience deep link, not the source of the drive number

---

## Data sources (nothing is fabricated)

### 1. Flight lookup — `/api/flight`

Tried only when a key is set:

1. **Aviationstack** if `AVIATIONSTACK_API_KEY` is set  
2. **AeroDataBox** (RapidAPI) if `AERODATABOX_KEY` is set  

There is no trustworthy no-key JSON API for scheduled departure / boarding as of 2026-08-19. OpenSky is ADS-B only (no published boarding time). If lookup fails or no key is set, the UI says **“couldn’t look that flight up”** and stays on the manual airport + time path. Gates and times are never invented.

### 2. TSA wait — `/api/tsa`

Official MyTSA `GetConfirmedWaitTimes.ashx` is **dead**: it 302s to `tsa.gov` HTML (confirmed 2026-08-19). Do not depend on it.

The proxy fetches server-rendered HTML from:

`https://flyindex.org/airports/{iata-lowercase}/tsa-wait-times/`

and parses the embedded `waitLookup` map plus **Estimated Wait Right Now**. If the flight is later today or another day, it uses the historical cell for the **boarding** weekday + hour in the airport’s local zone, not “right now.”

Labeled in the UI: **third-party estimate, not TSA-published**. Always overridable.

FlyIndex does not publish PreCheck minutes. With the PreCheck toggle on:

- use a PreCheck value if a future source returns one
- otherwise `max(5, round(standard_wait * 0.4))`, labeled as an **estimate, not official TSA**

The browser never calls FlyIndex directly (CORS + keep scraping on the server).

### 3. Drive time

1. Browser geolocation (asked on first calculate)
2. Google Distance Matrix **only if** `GOOGLE_MAPS_API_KEY` is set, via `/api/drive` (live traffic when Google returns `duration_in_traffic`)
3. Else public OSRM `https://router.project-osrm.org/route/v1/driving/{lon1},{lat1};{lon2},{lat2}?overview=false`, labeled **no live traffic**
4. Manual drive minutes always win

Airport coordinates come from the bundled US IATA table in `js/airports.js` (DFW, DAL, and other major hubs).

---

## Architecture

- Static PWA: vanilla HTML / CSS / JS (`index.html`, `css/app.css`, `js/*`)
- `manifest.webmanifest`, service worker (`sw.js`: offline shell + last result in `localStorage`)
- Apple tags: `apple-mobile-web-app-capable`, 180×180 `apple-touch-icon`, `theme-color`, `viewport-fit=cover`, standalone display
- Vercel serverless: `api/flight.js`, `api/tsa.js`, `api/drive.js` (shared logic in `js/`)
- Local `server.js` implements the same routes so `npm start` matches Vercel

```
leave_by = boarding − TSA − drive − parking
```

Shared math lives in `js/calc.js` and is covered by `tests/calc.test.mjs`.
