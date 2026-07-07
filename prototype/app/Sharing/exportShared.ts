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
export const SCENE3D_ATTRIBUTION = 'Cesium ion · Bing Maps · OSM Buildings © OpenStreetMap';
export const SCENE3D_FALLBACK_ATTRIBUTION = 'Natural Earth II';

export const LEGEND_HEIGHT = 56;

export interface LegendInput {
	lat: number;
	lon: number;
	/** Anzeige-Datum, z. B. "7.7.2026". */
	dateLabel: string;
	timeZone: string;
	rise: string;
	transit: string;
	set: string;
	attribution: string;
}

/**
 * Zeichnet die Export-Legende (Ort, Datum, Tagesdaten, Attribution) in einen
 * bereits auf CSS-Pixel skalierten 2D-Kontext. `legendTop` ist die Oberkante
 * der Legende, `widthCss` die Canvas-Breite in CSS-Pixeln.
 */
export function drawLegend(
	ctx: CanvasRenderingContext2D,
	widthCss: number,
	legendTop: number,
	colors: ExportColors,
	input: LegendInput,
): void {
	ctx.fillStyle = colors.card;
	ctx.fillRect(0, legendTop, widthCss, LEGEND_HEIGHT);
	ctx.fillStyle = colors.foreground;
	ctx.textAlign = 'left';
	ctx.textBaseline = 'middle';
	ctx.font = '600 13px system-ui, sans-serif';
	ctx.fillText(
		`Sunrays · ${input.lat.toFixed(5)}, ${input.lon.toFixed(5)} · ${input.dateLabel} (${input.timeZone})`,
		12,
		legendTop + 18,
	);
	ctx.font = '400 12px system-ui, sans-serif';
	ctx.fillText(
		`Aufgang ${input.rise} · Kulmination ${input.transit} · Untergang ${input.set}`,
		12,
		legendTop + 38,
	);
	ctx.fillStyle = colors.mutedForeground;
	ctx.textAlign = 'right';
	ctx.font = '400 10px system-ui, sans-serif';
	ctx.fillText(input.attribution, widthCss - 12, legendTop + 38);
}

/** Canvas → PNG-Blob (gemeinsamer Abschluss beider Export-Pfade). */
export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
	return new Promise<Blob>((resolve, reject) => {
		canvas.toBlob(blob => {
			if (blob) resolve(blob);
			else reject(new Error('PNG-Erzeugung fehlgeschlagen'));
		}, 'image/png');
	});
}
