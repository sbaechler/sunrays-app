# Deployment (Story 1.2)

## CI

`.github/workflows/ci.yml` führt bei jedem Push/PR aus: lint, typecheck, test, build.

## Cloudflare Pages (Produktion)

Einmalige manuelle Einrichtung (Account-gebunden, kann nicht automatisiert werden):

1. GitHub-Repo anlegen und pushen:
   ```bash
   gh repo create sunrays-web --private --source . --push
   ```
2. Cloudflare Dashboard → Workers & Pages → **Create → Pages → Connect to Git** → `sunrays-web`
   wählen.
3. Build-Konfiguration:
   - **Build command:** `npm run build`
   - **Build output directory:** `prototype/build/client` (Prototype-Phase; später `frontend/dist`)
   - **Node version:** `22` (Environment Variable `NODE_VERSION=22`)
4. Preview-Deployments für Branches sind bei Cloudflare Pages automatisch aktiv.
5. Deployment-URL nach dem ersten Build hier eintragen: `https://<projekt>.pages.dev`

## Telemetrie-Setup (Story 6.4, später)

- Cloudflare Web Analytics: im Pages-Projekt aktivieren (cookie-frei).
- Umami Cloud: Account + Website-ID anlegen, Snippet/ENV in der App hinterlegen.

## API-Keys / Tokens (manuelle Schritte)

In `.env` (Monorepo-Root) eintragen — alle optional, App degradiert kontrolliert ohne sie:

| Variable | Dienst | Wirkung |
|---|---|---|
| `VITE_CESIUM_ION_TOKEN` | Cesium ion Community (kostenlos) | 3D: World Terrain + OSM Buildings; ohne Token: Hinweisbanner + Minimal-Globus (FR10) |
| `VITE_GEOAPIFY_KEY` | Geoapify Free | Geocoding-Primärprovider; ohne Key läuft Photon (key-los) |
| `VITE_UMAMI_WEBSITE_ID` (+ optional `VITE_UMAMI_SRC`) | Umami Cloud Free | Custom-Event-Telemetrie; ohne ID keine Events |

Nach Eintrag des ion-Tokens: Story 4.1 Go/No-Go-PoC abschließen (Terrain/Gebäude prüfen,
Streaming-Volumen einer Session gegen die 15-GB-Quote messen, PNG-Export der 3D-Szene testen).

## Bekannte Punkte (Stand 2026-07-06)

- Story 4.1 Go/No-Go: **GO** (2026-07-07, mit ion-Token verifiziert — Terrain, Buildings,
  Fächer auf Geländehöhe, 2D/3D-Wechsel). Der Token-lose NaturalEarthII-Fallback rendert im
  Headless-Browser keinen Globus — auf echter Hardware gegenprüfen (niedrige Priorität).
- PNG-Export exportiert die 2D-Ansicht; 3D-Screenshot ist Follow-up (preserveDrawingBuffer).
- Marker in 3D: Klick-Platzierung; Drag ist Follow-up.
