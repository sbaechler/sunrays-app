/**
 * Berechnungs-State (Story 3.3, FR3–FR6): Datum + abgeleiteter Sonnenverlauf.
 * Jede Änderung von Marker oder Datum berechnet den Fächer sofort neu —
 * die Engine braucht ~0,01 ms pro Tages-Set, das kann synchron geschehen.
 */
import { atom } from 'jotai';
import {
  computeSunPath,
  timezoneAt,
  utcOffsetHoursAt,
  MAX_ABS_LATITUDE_DEG,
  type SunPath,
} from '@repo/solar';
import { markerAtom } from '#/Map/state';

/** Gewähltes Datum als ISO-String (YYYY-MM-DD); Default: heute. */
export const dateAtom = atom<string>(todayIso());

export function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(
    now.getDate(),
  ).padStart(2, '0')}`;
}

export interface SunState {
  path: SunPath;
  timeZone: string;
  latitude: number;
  longitude: number;
  date: string;
}

export type SunStateResult =
  | { status: 'empty' }
  | { status: 'out-of-range'; message: string }
  | ({ status: 'ready' } & SunState);

/** Abgeleiteter Sonnenverlauf für Marker + Datum (FR5, FR6). */
export const sunStateAtom = atom<SunStateResult>((get) => {
  const marker = get(markerAtom);
  const date = get(dateAtom);
  if (!marker) return { status: 'empty' };

  const [year = 0, month = 0, day = 0] = date.split('-').map(Number);
  if (Math.abs(marker.lat) > MAX_ABS_LATITUDE_DEG) {
    return {
      status: 'out-of-range',
      message: `Berechnung derzeit nur bis ±${MAX_ABS_LATITUDE_DEG}° Breite möglich.`,
    };
  }

  const timeZone = timezoneAt(marker.lat, marker.lon);
  const path = computeSunPath(marker.lat, marker.lon, { year, month, day }, (hour) =>
    utcOffsetHoursAt(timeZone, { year, month, day, hour }),
  );
  return {
    status: 'ready',
    path,
    timeZone,
    latitude: marker.lat,
    longitude: marker.lon,
    date,
  };
});

/** Dezimalstunden → "HH:MM" (lokale Ortszeit). */
export function formatHours(dec: number | null): string {
  if (dec === null) return '–';
  const h = Math.floor(dec) % 24;
  let m = Math.round((dec - Math.floor(dec)) * 60);
  let hh = h;
  if (m >= 60) {
    hh = (hh + 1) % 24;
    m -= 60;
  }
  return `${String(hh).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
