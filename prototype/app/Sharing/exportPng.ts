/**
 * PNG-Export der aktuellen 2D-Ansicht (Story 5.1, FR11): Karten-Canvas plus
 * direkt aufgezeichneter Fächer, Nordpfeil, Legende und eingebrannter
 * Attribution (Lizenzpflicht der Tile-Quelle).
 */
import type { MarkerPosition } from '#/Map/state';
import {
	canvasToPngBlob,
	drawLegend,
	LEGEND_HEIGHT,
	MAP_ATTRIBUTION,
	resolveThemeColors,
} from '#/Sharing/exportShared';
import { buildFanVectors } from '#/Sun/fanGeometry';
import { formatHours } from '#/Sun/state';
import { computeSunPosition, type SunPath } from '@repo/solar';
import type maplibregl from 'maplibre-gl';

const FAN_RADIUS = 120;
const LABEL_RADIUS = FAN_RADIUS + 16;

export interface PngExportInput {
	map: maplibregl.Map;
	marker: MarkerPosition;
	path: SunPath;
	date: string;
	timeZone: string;
}

export async function buildPngBlob(input: PngExportInput): Promise<Blob> {
	const { map, marker, path, date, timeZone } = input;
	const colors = resolveThemeColors();
	const [year = 0, month = 0, day = 0] = date.split('-').map(Number);

	// Frischen Frame erzwingen, damit der Buffer aktuell ist
	map.triggerRepaint();
	await map.once('render');

	const mapCanvas = map.getCanvas();
	const scale = mapCanvas.width / mapCanvas.clientWidth; // devicePixelRatio
	const canvas = document.createElement('canvas');
	canvas.width = mapCanvas.width;
	canvas.height = mapCanvas.height + LEGEND_HEIGHT * scale;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas 2D-Kontext nicht verfügbar');

	ctx.drawImage(mapCanvas, 0, 0);
	ctx.scale(scale, scale);

	// Fächer am Marker
	const center = map.project([marker.lon, marker.lat]);
	const azimuthAt = (dec: number) => {
		const hour = Math.floor(dec);
		const minute = Math.floor((dec - hour) * 60);
		const offset = path.hours[Math.min(Math.max(hour, 0), 23)]?.utcOffsetHours ?? 0;
		return computeSunPosition(marker.lat, marker.lon, { year, month, day, hour, minute }, offset)
			.azimuthDeg;
	};
	const vectors = buildFanVectors(path, map.getBearing(), azimuthAt);

	ctx.lineCap = 'round';
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	for (const v of vectors) {
		const isEvent = v.kind !== 'hour';
		const color = isEvent ? colors.sunRiseSet : colors.sunVector;
		ctx.strokeStyle = color;
		ctx.fillStyle = color;
		ctx.lineWidth = isEvent ? 2.5 : 1.75;
		ctx.beginPath();
		ctx.moveTo(center.x, center.y);
		ctx.lineTo(center.x + v.dx * FAN_RADIUS, center.y + v.dy * FAN_RADIUS);
		ctx.stroke();
		const text =
			v.kind === 'sunrise'
				? formatHours(path.sunRiseHours)
				: v.kind === 'sunset'
					? formatHours(path.sunSetHours)
					: v.label;
		ctx.font = `${isEvent ? '600 11px' : '500 12px'} system-ui, sans-serif`;
		const lx = center.x + v.dx * LABEL_RADIUS;
		const ly = center.y + v.dy * LABEL_RADIUS;
		ctx.strokeStyle = colors.background;
		ctx.lineWidth = 3;
		ctx.strokeText(text, lx, ly);
		ctx.fillText(text, lx, ly);
	}
	// Marker-Punkt
	ctx.fillStyle = colors.sunVector;
	ctx.beginPath();
	ctx.arc(center.x, center.y, 4, 0, 2 * Math.PI);
	ctx.fill();

	// Nordpfeil oben rechts (folgt dem Karten-Bearing)
	const nx = mapCanvas.clientWidth - 36;
	const ny = 44;
	ctx.save();
	ctx.translate(nx, ny);
	ctx.rotate((-map.getBearing() * Math.PI) / 180);
	ctx.strokeStyle = colors.foreground;
	ctx.fillStyle = colors.foreground;
	ctx.lineWidth = 1.5;
	ctx.beginPath();
	ctx.moveTo(0, 12);
	ctx.lineTo(0, -8);
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(0, -16);
	ctx.lineTo(4.5, -6);
	ctx.lineTo(-4.5, -6);
	ctx.closePath();
	ctx.fill();
	ctx.font = '600 12px system-ui, sans-serif';
	ctx.fillText('N', 0, 24);
	ctx.restore();

	// Legende (unterhalb der Karte)
	drawLegend(ctx, mapCanvas.clientWidth, mapCanvas.clientHeight, colors, {
		lat: marker.lat,
		lon: marker.lon,
		dateLabel: `${day}.${month}.${year}`,
		timeZone,
		rise: formatHours(path.sunRiseHours),
		transit: formatHours(path.sunTransitHours),
		set: formatHours(path.sunSetHours),
		attribution: MAP_ATTRIBUTION,
	});

	return canvasToPngBlob(canvas);
}
