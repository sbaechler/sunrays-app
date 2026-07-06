# Deployment (Story 1.2)

## CI

`.github/workflows/ci.yml` führt bei jedem Push/PR aus: lint, typecheck, test, build.

## Cloudflare Pages (Produktion)

Einmalige manuelle Einrichtung (Account-gebunden, kann nicht automatisiert werden):

1. GitHub-Repo anlegen und pushen:
   ```bash
   gh repo create sunrays-web --private --source . --push
   ```
2. Cloudflare Dashboard → Workers & Pages → **Create → Pages → Connect to Git** → `sunrays-web` wählen.
3. Build-Konfiguration:
   - **Build command:** `npm run build`
   - **Build output directory:** `prototype/build/client` (Prototype-Phase; später `frontend/dist`)
   - **Node version:** `22` (Environment Variable `NODE_VERSION=22`)
4. Preview-Deployments für Branches sind bei Cloudflare Pages automatisch aktiv.
5. Deployment-URL nach dem ersten Build hier eintragen: `https://<projekt>.pages.dev`

## Telemetrie-Setup (Story 6.4, später)

- Cloudflare Web Analytics: im Pages-Projekt aktivieren (cookie-frei).
- Umami Cloud: Account + Website-ID anlegen, Snippet/ENV in der App hinterlegen.
