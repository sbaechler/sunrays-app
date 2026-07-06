/**
 * Gemeinsame Export-Helfer (Epic 5): Theme-Farben auflösen, Dateinamen,
 * Download-Trigger. CSS-Variablen müssen für Exporte in konkrete Farbwerte
 * aufgelöst werden (in eigenständigen SVG/PNG-Dateien gibt es kein Theme).
 */

export interface ExportColors {
  sunVector: string;
  sunRiseSet: string;
  foreground: string;
  background: string;
  card: string;
  mutedForeground: string;
}

export function resolveThemeColors(): ExportColors {
  const style = getComputedStyle(document.documentElement);
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback;
  return {
    sunVector: read('--sun-vector', '#9a7a2d'),
    sunRiseSet: read('--sun-riseset', '#2a7c83'),
    foreground: read('--foreground', '#0b0f14'),
    background: read('--background', '#f6f1e7'),
    card: read('--card', '#fffdf8'),
    mutedForeground: read('--muted-foreground', '#6c635b'),
  };
}

export function exportFilename(ext: 'png' | 'svg', date: string, lat: number, lon: number): string {
  return `sunrays_${date}_${lat.toFixed(4)}_${lon.toFixed(4)}.${ext}`;
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const MAP_ATTRIBUTION = 'OpenFreeMap © OpenMapTiles · Data from OpenStreetMap';
