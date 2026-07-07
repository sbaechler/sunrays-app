# Sunrays Frontend

Die produktive Web-App: Sonnenverlauf für Ort und Datum — Planungstool für DoPs und Fotograf:innen.
2D (MapLibre + OpenFreeMap), 3D (CesiumJS + ion), Export (PNG/SVG/Share-Link), PWA, DE/EN.

## Struktur (feature-basiert)

| Ordner         | Inhalt                                             |
| -------------- | -------------------------------------------------- |
| `app/Map`      | 2D-Karte, 3D-Ansicht, Marker, URL-State, Map-Style |
| `app/Sun`      | Fächer-Overlay, Datums-Controls, Sonnen-State      |
| `app/Search`   | Geocoding (Geoapify/Photon) + Suchfeld             |
| `app/Sharing`  | PNG/SVG-Export, Share-Link                         |
| `app/Settings` | i18n, Theme, Telemetrie                            |
| `e2e/`         | Playwright-Smoke-Tests                             |

Die Berechnungs-Engine liegt in `packages/solar` (golden-getestet gegen die Python-Legacy-App).

## Entwicklung

```shellscript
npm run dev          # vom Monorepo-Root (turbo) oder hier im Workspace
npm test             # Unit-Tests (vitest)
npm run test:e2e     # Playwright-Smoke (baut + startet Preview selbst)
npm run typecheck
```

ENV (Monorepo-Root `.env`): `VITE_CESIUM_ION_TOKEN` (3D), optional `VITE_GEOAPIFY_KEY`,
`VITE_UMAMI_WEBSITE_ID`. Deployment: siehe `docs/deployment.md`.
