#!/usr/bin/env python3
"""Erzeugt einen verhaltensgleichen Python-3-Port von src/sunrays/sonnenmodul2.py.

Der Port dient ausschliesslich der Golden-Fixture-Generierung (Story 2.1).
Es werden NUR mechanische Syntax-Transformationen vorgenommen; der Algorithmus
bleibt unveraendert. Dokumentierte Abweichungen:

1. `<>` -> `!=` (Py2-Ungleichheits-Operator)
2. `is not 'sun'` / `is not 'moon'` (String-Identitaet) -> `!=`
3. `raise(SyntaxError, msg)` (Py2-Tupel-Raise) -> `raise ValueError(msg)`
4. `import pytz` entfernt; der timezone-Zweig von initDate wird nicht genutzt
   (Fixtures uebergeben utc_offset explizit, via zoneinfo korrekt auch fuer
   negative Offsets berechnet).
5. CalcJD: mutierte das datetime-Objekt (`date.year -= 1`) — auf immutablen
   py3-datetimes ein AttributeError (und schon in Py2 nur zufaellig nie
   ausgeloest, da die App keine Jan/Feb-Mutation traf). Ersetzt durch lokale
   Variablen; identisches Verhalten fuer Monat >= 3, korrekt fuer Jan/Feb.
6. Zusatzfeld `form.SunAltTrue` (Elevation OHNE Refraktion), da die neue
   TS-Engine beide Werte vergleichen koennen soll.
7. `__main__`-Testblock (Py2-print) entfernt; die Referenzwerte daraus prueft
   generate_fixtures.py als Sanity-Check.
"""
import re
from pathlib import Path

SRC = Path(__file__).resolve().parents[3] / 'src' / 'sunrays' / 'sonnenmodul2.py'
DST = Path(__file__).parent / 'sonnenmodul2_py3.py'

code = SRC.read_text(encoding='utf-8')

# __main__-Block abschneiden (enthaelt Py2-print)
code = code[:code.index('if __name__ == "__main__":')]

# 1. Py2-Ungleichheit
code = code.replace('<>', '!=')

# 2. String-Identitaet
code = code.replace("is not 'sun'", "!= 'sun'").replace("is not 'moon'", "!= 'moon'")

# 3. Py2-Tupel-Raise (zwei Vorkommen, eines ueber zwei Zeilen)
code = re.sub(r'raise\(SyntaxError,\s*(.*?)\)\n', r'raise ValueError(\1)\n', code, flags=re.S)

# 4. pytz entfernen
code = code.replace('import pytz\n', '')

# 5. CalcJD ohne datetime-Mutation
code = code.replace(
    """    jd = 2415020.5-64 # 1.1.1900 - correction of algorithm
    if (date.month<=2):
        date.year-=1
        date.month += 12
    jd += Int( (date.year-1900)*365.25 )
    jd += Int( 30.6001*(1+date.month) )
    return(jd + date.day)""",
    """    year, month, day = date.year, date.month, date.day
    jd = 2415020.5-64 # 1.1.1900 - correction of algorithm
    if (month<=2):
        year-=1
        month += 12
    jd += Int( (year-1900)*365.25 )
    jd += Int( 30.6001*(1+month) )
    return(jd + day)""")

# 6. Elevation ohne Refraktion zusaetzlich ablegen
code = code.replace(
    "        form.SunAlt  = sunCoor.alt+math.radians(Refraction(sunCoor.alt))  # including refraction",
    "        form.SunAltTrue = sunCoor.alt  # without refraction (addition for golden fixtures)\n"
    "        form.SunAlt  = sunCoor.alt+math.radians(Refraction(sunCoor.alt))  # including refraction")

header = '"""Python-3-Port von sonnenmodul2.py — NUR fuer Golden-Fixture-Generierung.\n' \
         'Automatisch erzeugt durch build_py3_port.py; nicht von Hand editieren.\n"""\n'
DST.write_text(header + code, encoding='utf-8')
print(f'geschrieben: {DST}')

# Verifikation: Port muss kompilieren
import py_compile
py_compile.compile(str(DST), doraise=True)
print('py_compile: OK')
