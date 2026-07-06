# Golden-Referenzdaten für die Solar-Engine (Story 2.1)

Referenzdaten für die Golden-Tests des TypeScript-Ports (Story 2.2, NFR3).
Erzeugt aus der Legacy-Engine [`src/sunrays/sonnenmodul2.py`](../../../src/sunrays/sonnenmodul2.py) — das Legacy-Repo wurde dabei nur gelesen.

## Dateien

| Datei | Zweck |
|---|---|
| `build_py3_port.py` | Erzeugt `sonnenmodul2_py3.py` aus der Legacy-Quelle (mechanische Py2→Py3-Transformationen, Algorithmus unverändert; Abweichungen im Docstring dokumentiert) |
| `sonnenmodul2_py3.py` | Generierter Python-3-Port — nicht von Hand editieren |
| `generate_fixtures.py` | Berechnet die Fixtures; enthält Sanity-Check gegen die im Legacy-`__main__` dokumentierten Referenzwerte (Reykjavik 2006) |
| `sun-golden-fixtures.json` | Die Fixture-Daten (2760 Stunden-Datensätze) |

## Regenerieren

```bash
cd _bmad-output/implementation-artifacts/golden
python3 build_py3_port.py && python3 generate_fixtures.py
```

## Abdeckung

- **23 Orte**: u. a. Äquator (Quito, Singapur), hohe Breiten (Reykjavik, Fairbanks — Legacy-Limit |lat| ≤ 65), Südhalbkugel (Sydney, Ushuaia, …), exotische Zeitzonen (Kathmandu UTC+5:45, Mumbai +5:30, Teheran +3:30, St. John's −3:30), Datumsgrenze (Apia UTC+13, Kiritimati UTC+14)
- **5 Daten 2026**: beide Solstitien, beide Äquinoktien, EU-DST-Umstellung (29. März)
- **Pro Ort×Datum**: alle 24 vollen lokalen Stunden (Azimut, Elevation mit/ohne Refraktion) + Auf-/Untergang/Kulmination

## Konventionen & Toleranzen

- Azimut: Grad ab Nord, im Uhrzeigersinn. Elevation: `altitudeTrueDeg` ohne, `altitudeRefractedDeg` mit Refraktion (1015 mbar/20 °C wie Legacy).
- Zeiten: lokale Ortszeit (IANA, DST-korrekt); `utcOffsetHours` pro Stunde mitgeliefert.
- **Golden-Test-Toleranzen (NFR3): ±0,1° Winkel, ±1 min Zeiten.**

## Validierung

1. Sanity-Check gegen die dokumentierten Legacy-Referenzwerte (Reykjavik 2006-08-06): JD, Azimut, Elevation, Auf-/Untergang, Kulmination — bestanden.
2. Spot-Checks gegen unabhängige Referenzen (2026-06-21): Zürich Aufgang 05:29/Untergang 21:26 MESZ, Ushuaia 09:59/17:11 — minutengenau.

## Nächster Schritt (Story 2.2)

Diesen Ordner nach `sunrays-web` kopieren (z. B. `packages/solar/golden/`); die Vitest-Golden-Tests lesen `sun-golden-fixtures.json` direkt.
