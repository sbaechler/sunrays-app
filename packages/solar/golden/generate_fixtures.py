#!/usr/bin/env python3
"""Golden-Fixture-Generator (Story 2.1).

Berechnet mit dem Py3-Port der Legacy-Engine (sonnenmodul2_py3.py) fuer einen
Satz von Orten und Daten stuendliche Sonnenpositionen sowie Auf-/Untergangs-
und Kulminationszeiten und schreibt sie als JSON-Fixture.

Konventionen (fuer die TS-Golden-Tests, NFR3):
- azimuthDeg: Grad ab Nord, im Uhrzeigersinn (0=N, 90=O, 180=S, 270=W)
- altitudeTrueDeg: Elevation ohne Refraktion
- altitudeRefractedDeg: Elevation inkl. Refraktion (Standardatmosphaere
  1015 mbar / 20 Grad C, wie Legacy)
- hours: jede volle Stunde 00-23 in LOKALER Zeit des Ortes; utcOffsetHours ist
  der via IANA/zoneinfo bestimmte Offset der jeweiligen lokalen Stunde
  (DST-korrekt; nicht existente Stunden am DST-Sprung tragen den
  Post-Transition-Offset, fold=0)
- sunRise/sunSet/sunTransit: lokale Dezimalstunden + "HH:MM"; null, wenn kein
  Ereignis (Legacy-Limit: |lat| <= 65)
- Toleranzen fuer Golden-Tests: Azimut/Elevation +-0.1 Grad, Zeiten +-1 min
"""
import json
import math
import sys
from datetime import datetime, date as ddate
from pathlib import Path
from zoneinfo import ZoneInfo

sys.path.insert(0, str(Path(__file__).parent))
import sonnenmodul2_py3 as sm

OUT = Path(__file__).parent / 'sun-golden-fixtures.json'

LOCATIONS = [
    # (name, lat, lon, IANA-tz)  — Legacy-Limit: |lat| <= 65
    ("Zuerich", 47.3769, 8.5417, "Europe/Zurich"),
    ("Berlin", 52.5200, 13.4050, "Europe/Berlin"),
    ("London", 51.5074, -0.1278, "Europe/London"),
    ("Reykjavik", 64.1500, -21.9500, "Atlantic/Reykjavik"),
    ("Fairbanks", 64.8400, -147.7200, "America/Anchorage"),
    ("Quito", -0.1800, -78.4700, "America/Guayaquil"),
    ("Singapur", 1.3521, 103.8198, "Asia/Singapore"),
    ("Nairobi", -1.2921, 36.8219, "Africa/Nairobi"),
    ("Sydney", -33.8688, 151.2093, "Australia/Sydney"),
    ("Kapstadt", -33.9249, 18.4241, "Africa/Johannesburg"),
    ("Buenos Aires", -34.6037, -58.3816, "America/Argentina/Buenos_Aires"),
    # Rio Grande statt Ushuaia: Ushuaia liegt im tz-lookup-Grid auf der
    # Grenzzelle zu Chile (America/Punta_Arenas, gleicher Offset)
    ("Rio Grande", -53.7877, -67.7095, "America/Argentina/Ushuaia"),
    ("Kathmandu", 27.7172, 85.3240, "Asia/Kathmandu"),          # UTC+5:45
    ("Mumbai", 19.0760, 72.8777, "Asia/Kolkata"),               # UTC+5:30
    ("Teheran", 35.6892, 51.3890, "Asia/Tehran"),               # UTC+3:30
    ("St. John's", 47.5615, -52.7126, "America/St_Johns"),      # UTC-3:30
    ("Apia", -13.8506, -171.7513, "Pacific/Apia"),              # UTC+13, Datumsgrenze
    ("Kiritimati", 1.8721, -157.4278, "Pacific/Kiritimati"),    # UTC+14
    ("Honolulu", 21.3069, -157.8583, "Pacific/Honolulu"),
    ("Los Angeles", 34.0522, -118.2437, "America/Los_Angeles"),
    ("New York", 40.7128, -74.0060, "America/New_York"),
    ("Tokio", 35.6762, 139.6503, "Asia/Tokyo"),
    ("Auckland", -36.8485, 174.7633, "Pacific/Auckland"),
]

DATES = [
    ddate(2026, 3, 20),   # Aequinoktium Fruehling
    ddate(2026, 3, 29),   # EU-DST-Umstellung (Sonntag)
    ddate(2026, 6, 21),   # Solstitium Sommer
    ddate(2026, 9, 23),   # Aequinoktium Herbst
    ddate(2026, 12, 21),  # Solstitium Winter
]

RAD = 180.0 / math.pi


def hhmm(dec_hours):
    if dec_hours is None:
        return None
    h = int(dec_hours) % 24
    m = round((dec_hours - int(dec_hours)) * 60.0)
    if m >= 60:
        h, m = (h + 1) % 24, m - 60
    return f"{h:02d}:{m:02d}"


def utc_offset_hours(tz, local_naive):
    return tz.utcoffset(local_naive.replace(tzinfo=tz)).total_seconds() / 3600.0


def compute(lat, lon, local_naive, offset):
    form = sm.Init(laengengrad=lon, breitengrad=lat, date=local_naive,
                   utc_offset=offset, what='sun')
    sm.Compute(form)
    return form


def sanity_check():
    """Referenzwerte aus dem originalen __main__-Block (Reykjavik, 2006-08-06 06:00 UTC)."""
    form = compute(64.15, -21.95, datetime(2006, 8, 6, 6, 0, 0), 0)
    checks = [
        ("JD", form.JD, 2453953.75, 1e-4),
        ("SunAz", math.degrees(form.SunAz), 61.97, 0.05),
        ("SunAlt (inkl. Refraktion)", math.degrees(form.SunAlt), 5.8, 0.1),
        ("SunRise", form.SunRise, 4.834, 1.0 / 60),
        ("SunTransit", form.SunTransit, 13.56, 1.0 / 60),
        ("SunSet", form.SunSet, 22.248, 1.0 / 60),
    ]
    for name, got, want, tol in checks:
        assert abs(got - want) <= tol, f"Sanity-Check FEHLGESCHLAGEN: {name}: {got} != {want} (+-{tol})"
    print("Sanity-Check gegen Legacy-Referenzwerte (Reykjavik 2006): OK")


def main():
    sanity_check()
    locations = []
    n_rows = 0
    for name, lat, lon, tzname in LOCATIONS:
        tz = ZoneInfo(tzname)
        cases = []
        for d in DATES:
            hours = []
            for h in range(24):
                local = datetime(d.year, d.month, d.day, h, 0, 0)
                offset = utc_offset_hours(tz, local)
                form = compute(lat, lon, local, offset)
                hours.append({
                    "localTime": f"{h:02d}:00",
                    "utcOffsetHours": offset,
                    "azimuthDeg": round(math.degrees(form.SunAz), 4),
                    "altitudeTrueDeg": round(math.degrees(form.SunAltTrue), 4),
                    "altitudeRefractedDeg": round(math.degrees(form.SunAlt), 4),
                })
                n_rows += 1
            noon = datetime(d.year, d.month, d.day, 12, 0, 0)
            form = compute(lat, lon, noon, utc_offset_hours(tz, noon))
            cases.append({
                "date": d.isoformat(),
                "sunRiseHours": round(form.SunRise, 5) if form.SunRise is not None else None,
                "sunRise": hhmm(form.SunRise),
                "sunSetHours": round(form.SunSet, 5) if form.SunSet is not None else None,
                "sunSet": hhmm(form.SunSet),
                "sunTransitHours": round(form.SunTransit, 5) if form.SunTransit is not None else None,
                "sunTransit": hhmm(form.SunTransit),
                "hours": hours,
            })
        locations.append({
            "name": name, "latitude": lat, "longitude": lon, "timezone": tzname,
            "cases": cases,
        })

    fixture = {
        "$schema": "sun-golden-fixtures",
        "generatedBy": "generate_fixtures.py gegen sonnenmodul2_py3.py (Port von src/sunrays/sonnenmodul2.py)",
        "conventions": {
            "azimuthDeg": "Grad ab Nord, im Uhrzeigersinn",
            "altitudeTrueDeg": "Elevation ohne Refraktion",
            "altitudeRefractedDeg": "Elevation inkl. Refraktion (1015 mbar, 20 C)",
            "times": "lokale Zeit des Ortes (IANA), Stunden 00-23, DST-korrekt (fold=0)",
            "tolerances": {"angleDeg": 0.1, "timeMinutes": 1},
            "legacyLatitudeLimit": 65,
        },
        "locations": locations,
    }
    OUT.write_text(json.dumps(fixture, indent=1, ensure_ascii=False), encoding='utf-8')
    print(f"geschrieben: {OUT} ({n_rows} Stunden-Datensaetze, "
          f"{len(LOCATIONS)} Orte x {len(DATES)} Daten)")


if __name__ == "__main__":
    main()
