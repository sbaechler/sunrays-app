# Sunrays Monorepo

Web-App **Sunrays**: Sonnenverlauf für Ort und Datum — Planungstool für DoPs und Fotograf:innen.
Basierend auf dem Tinker-Stack-Starter.

Workspaces:

- `frontend`: die produktive React-Router-SPA (siehe `frontend/README.md`)
- `packages/solar`: Berechnungskern (golden-getestet gegen die Python-Legacy-App)
- `ui`: geteilte UI-Primitives und Tailwind-Theme
- `config/*`: geteilte ESLint-/TypeScript-Konfiguration
- `docs`: Antora-Projektdokumentation

## Build & Entwicklung

Vom Repository-Root:

```bash
npm run dev        # Dev-Server (turbo)
npm run build      # Produktions-Build (frontend/build/client)
npm run lint
npm run typecheck
npm run test       # Unit-Tests (Solar-Engine, Map-Style)
```

E2E-Smoke und Bundle-Budget laufen im `frontend`-Workspace (`npm run test:e2e`,
`node scripts/check-bundle-budget.mjs`) und in der CI.

## Sunrays-Projektkontext

Dieses Repo ist der Web-Rewrite der Legacy-Desktop-App [Sunrays](https://github.com/)
(Python/wxWidgets, lokal: `~/projects/Sunrays`, read-only Referenz).

- **Planungs-Artefakte** (PRD, Architektur, UX-Spec, Epics & Stories):
  `~/projects/Sunrays/_bmad-output/planning-artifacts/`
- **Umsetzungsreihenfolge:** `epics.md` dort; Stack-Entscheidungen im `3d-tech-spike-report.md`
- **Stack:** CesiumJS + Cesium ion Community (3D), MapLibre GL JS + OpenFreeMap (2D),
  Geoapify/Photon (Geocoding), Cloudflare Pages (Hosting)
- **`packages/solar`:** Berechnungskern, portiert aus der Legacy-Engine, verifiziert durch
  Golden-Tests (±0,1° / ±1 min)
