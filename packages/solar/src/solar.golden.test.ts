/**
 * Golden-Tests der Solar-Engine gegen die Legacy-Referenzdaten (Story 2.2, NFR3).
 * Fixtures: erzeugt aus sonnenmodul2.py, siehe ../golden/README.md.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { computeSunPath } from './solar.js';

interface FixtureHour {
  localTime: string;
  utcOffsetHours: number;
  azimuthDeg: number;
  altitudeTrueDeg: number;
  altitudeRefractedDeg: number;
}

interface FixtureCase {
  date: string;
  sunRiseHours: number | null;
  sunSetHours: number | null;
  sunTransitHours: number | null;
  hours: FixtureHour[];
}

interface FixtureLocation {
  name: string;
  latitude: number;
  longitude: number;
  timezone: string;
  cases: FixtureCase[];
}

interface Fixture {
  conventions: { tolerances: { angleDeg: number; timeMinutes: number } };
  locations: FixtureLocation[];
}

const fixturePath = join(
  dirname(fileURLToPath(import.meta.url)),
  '..',
  'golden',
  'sun-golden-fixtures.json',
);
const fixture: Fixture = JSON.parse(readFileSync(fixturePath, 'utf-8'));

const ANGLE_TOL = fixture.conventions.tolerances.angleDeg; // 0.1°
const TIME_TOL_HOURS = fixture.conventions.tolerances.timeMinutes / 60; // 1 min

// Port-Fidelität: identischer Algorithmus muss weit unter der Spez-Toleranz
// liegen (Fixture-Quantisierung: 4 Nachkommastellen).
const PORT_ANGLE_TOL = 0.001;

let maxAngleDev = 0;
let maxTimeDevHours = 0;

describe('Solar-Engine Golden-Tests (Legacy-Parität)', () => {
  for (const loc of fixture.locations) {
    describe(`${loc.name} (${loc.latitude}, ${loc.longitude})`, () => {
      for (const c of loc.cases) {
        it(c.date, () => {
          const [year = 0, month = 0, day = 0] = c.date.split('-').map(Number);
          const path = computeSunPath(loc.latitude, loc.longitude, { year, month, day }, (h) => {
            const hour = c.hours[h];
            if (!hour) throw new Error(`Fixture ohne Stunde ${h}`);
            return hour.utcOffsetHours;
          });

          for (let h = 0; h < 24; h++) {
            const want = c.hours[h]!;
            const got = path.hours[h]!;
            for (const key of ['azimuthDeg', 'altitudeTrueDeg', 'altitudeRefractedDeg'] as const) {
              const dev = Math.abs(got[key] - want[key]);
              maxAngleDev = Math.max(maxAngleDev, dev);
              expect(dev, `${key} @ ${want.localTime}`).toBeLessThanOrEqual(ANGLE_TOL);
              expect(dev, `${key} @ ${want.localTime} (Port-Fidelität)`).toBeLessThanOrEqual(
                PORT_ANGLE_TOL,
              );
            }
          }

          for (const [gotVal, wantVal, label] of [
            [path.sunRiseHours, c.sunRiseHours, 'sunRise'],
            [path.sunSetHours, c.sunSetHours, 'sunSet'],
            [path.sunTransitHours, c.sunTransitHours, 'sunTransit'],
          ] as const) {
            if (wantVal === null) {
              expect(gotVal, label).toBeNull();
            } else {
              expect(gotVal, label).not.toBeNull();
              const dev = Math.abs((gotVal as number) - wantVal);
              maxTimeDevHours = Math.max(maxTimeDevHours, dev);
              expect(dev, label).toBeLessThanOrEqual(TIME_TOL_HOURS);
            }
          }
        });
      }
    });
  }

  it('Zusammenfassung: maximale Abweichungen', () => {
    // eslint-disable-next-line no-console
    console.info(
      `max. Winkelabweichung: ${maxAngleDev.toExponential(3)}°, ` +
        `max. Zeitabweichung: ${(maxTimeDevHours * 3600).toFixed(3)} s`,
    );
    expect(maxAngleDev).toBeLessThanOrEqual(ANGLE_TOL);
    expect(maxTimeDevHours).toBeLessThanOrEqual(TIME_TOL_HOURS);
  });
});
