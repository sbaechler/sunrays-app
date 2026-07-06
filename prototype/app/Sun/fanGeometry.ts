/**
 * Fächer-Geometrie (Story 3.4, FR7): reine Funktionen, testbar ohne DOM.
 * Bildschirm-Koordinaten: x nach rechts, y nach unten; Azimut 0° = Nord.
 */
import type { SunPath } from '@repo/solar';

export interface FanVector {
  kind: 'hour' | 'sunrise' | 'sunset';
  label: string;
  azimuthDeg: number;
  altitudeDeg: number;
  /** Einheitsvektor der Bildschirm-Richtung (vom Marker weg). */
  dx: number;
  dy: number;
}

/**
 * Sichtbare Vektoren eines Tagesverlaufs: alle vollen Stunden mit Sonne über
 * dem Horizont plus Auf- und Untergang. `mapBearingDeg` dreht den Fächer mit
 * der Karte (0 = Norden oben).
 */
export function buildFanVectors(
  path: SunPath,
  mapBearingDeg: number,
  sunAzimuthAt: (decimalHours: number) => number,
): FanVector[] {
  const vectors: FanVector[] = [];

  const toScreen = (azimuthDeg: number) => {
    const angleRad = ((azimuthDeg - mapBearingDeg) * Math.PI) / 180;
    return { dx: Math.sin(angleRad), dy: -Math.cos(angleRad) };
  };

  if (path.sunRiseHours !== null) {
    const az = sunAzimuthAt(path.sunRiseHours);
    vectors.push({
      kind: 'sunrise',
      label: 'Aufgang',
      azimuthDeg: az,
      altitudeDeg: 0,
      ...toScreen(az),
    });
  }

  for (const h of path.hours) {
    if (h.altitudeRefractedDeg <= 0) continue;
    vectors.push({
      kind: 'hour',
      label: String(h.localHour),
      azimuthDeg: h.azimuthDeg,
      altitudeDeg: h.altitudeRefractedDeg,
      ...toScreen(h.azimuthDeg),
    });
  }

  if (path.sunSetHours !== null) {
    const az = sunAzimuthAt(path.sunSetHours);
    vectors.push({
      kind: 'sunset',
      label: 'Untergang',
      azimuthDeg: az,
      altitudeDeg: 0,
      ...toScreen(az),
    });
  }

  return vectors;
}
