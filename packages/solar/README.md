# @sunrays/solar — Berechnungskern (Epic 2)

TypeScript-Port der Legacy-Sonnenstandsberechnung (`sonnenmodul2.py`) plus Zeitzonen-Ermittlung. DOM-frei, keine Framework-Abhängigkeiten.

**Status:** Stories 2.1–2.3 abgeschlossen; 166 Tests grün (116 Golden-Tests, Port-Genauigkeit 5×10⁻⁵ °, Zeiten < 0,02 s; Performance 0,013 ms pro Tages-Set bei Ziel < 50 ms).

## API

```ts
import {
  computeSunPath,        // kompletter Tagesverlauf (Basis des Fächers, FR5)
  computeSunPosition,    // einzelner Zeitpunkt
  computeSunEvents,      // Auf-/Untergang/Kulmination
  timezoneAt,            // IANA-Zone aus Lat/Lon (FR4)
  utcOffsetHoursAt,      // DST-korrekter Offset einer lokalen Zeit (NFR4)
  utcOffsetHoursAtPosition,
} from '@sunrays/solar';

const { timeZone, utcOffsetHours } = utcOffsetHoursAtPosition(47.38, 8.54, {
  year: 2026, month: 6, day: 21, hour: 12,
});
const path = computeSunPath(47.38, 8.54, { year: 2026, month: 6, day: 21 }, (h) =>
  utcOffsetHoursAt(timeZone, { year: 2026, month: 6, day: 21, hour: h }),
);
```

Konventionen: Azimut in Grad ab Nord im Uhrzeigersinn; Elevation mit/ohne Refraktion; Gültigkeitsbereich wie Legacy (1901–2099, |lat| ≤ 65°); DST-Lücken werden wie Python `zoneinfo` (fold=0) behandelt.

## Integration ins Monorepo (nach Abschluss von Story 1.1)

1. Ordner als Workspace-Paket übernehmen (z. B. `packages/solar/`), `golden/` daneben oder Pfad in den Tests anpassen (die Tests lesen `../../golden/sun-golden-fixtures.json`).
2. `npm test` / `npm run typecheck` in die Turbo-Pipeline aufnehmen.

Abhängigkeit: `@photostructure/tz-lookup` (gepflegter Fork von tz-lookup). Grenznahe Orte können durch das vereinfachte Grid in die Nachbarzone fallen (siehe Rio-Grande-Kommentar im Fixture-Generator) — für Sunrays unkritisch, da Nachbarzonen an Landgrenzen fast immer offsetgleich sind; bei Bedarf später durch polygonbasierten Lookup ersetzbar.
