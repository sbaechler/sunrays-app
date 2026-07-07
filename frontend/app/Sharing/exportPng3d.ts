/**
 * PNG-Export der 3D-Ansicht (Follow-up zu Story 5.1, FR11): Der Fächer ist in
 * der Cesium-Szene bereits räumlich gerendert — exportiert wird der
 * Scene-Canvas (preserveDrawingBuffer) plus Legende und Attribution.
 *
 * Nur Typ-Importe aus 'cesium', damit dieser Code nicht im Haupt-Bundle
 * landet (die 3D-Ansicht wird lazy geladen).
 */
import type { MarkerPosition } from '#/Map/state';
import {
	canvasToPngBlob,
	drawLegend,
	LEGEND_HEIGHT,
	resolveThemeColors,
} from '#/Sharing/exportShared';
import { formatHours } from '#/Sun/state';
import type { SunPath } from '@repo/solar';
import type { Viewer } from 'cesium';

export interface Png3dExportInput {
	viewer: Viewer;
	marker: MarkerPosition;
	path: SunPath;
	date: string;
	timeZone: string;
	attribution: string;
}

export function buildPng3dBlob(input: Png3dExportInput): Promise<Blob> {
	const { viewer, marker, path, date, timeZone, attribution } = input;
	const colors = resolveThemeColors();
	const [year = 0, month = 0, day = 0] = date.split('-').map(Number);

	// Frischen Frame in den (erhaltenen) Buffer zeichnen
	viewer.scene.requestRender();
	viewer.scene.render();

	const sceneCanvas = viewer.canvas;
	const scale = sceneCanvas.width / sceneCanvas.clientWidth || 1; // devicePixelRatio
	const canvas = document.createElement('canvas');
	canvas.width = sceneCanvas.width;
	canvas.height = sceneCanvas.height + Math.round(LEGEND_HEIGHT * scale);
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2D-Kontext nicht verfügbar');

	ctx.drawImage(sceneCanvas, 0, 0);
	ctx.scale(scale, scale);

	drawLegend(ctx, sceneCanvas.clientWidth, sceneCanvas.clientHeight, colors, {
		lat: marker.lat,
		lon: marker.lon,
		dateLabel: `${day}.${month}.${year}`,
		timeZone,
		rise: formatHours(path.sunRiseHours),
		transit: formatHours(path.sunTransitHours),
		set: formatHours(path.sunSetHours),
		attribution,
	});

	return canvasToPngBlob(canvas);
}
