/**
 * SVG-Export des 2D-Fächers (Story 5.2, FR12): eigenständige, nord-orientierte
 * Vektorgrafik mit Nordpfeil, Stundenbeschriftung und Legende — ohne
 * Karten-Hintergrund, zur Weiterverarbeitung in Drehplänen.
 */
import { resolveThemeColors } from '#/Sharing/exportShared';
import { buildFanVectors } from '#/Sun/fanGeometry';
import { formatHours } from '#/Sun/state';
import { computeSunPosition, type SunPath } from '@repo/solar';

const R = 150;
const LABEL_R = R + 18;
const W = 420;
const H = 470;
const CX = W / 2;
const CY = 215;

function esc(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export interface SvgExportInput {
	path: SunPath;
	latitude: number;
	longitude: number;
	date: string;
	timeZone: string;
}

export function buildFanSvg(input: SvgExportInput): string {
	const { path, latitude, longitude, date, timeZone } = input;
	const colors = resolveThemeColors();
	const [year = 0, month = 0, day = 0] = date.split('-').map(Number);

	const azimuthAt = (dec: number) => {
		const hour = Math.floor(dec);
		const minute = Math.floor((dec - hour) * 60);
		const offset = path.hours[Math.min(Math.max(hour, 0), 23)]?.utcOffsetHours ?? 0;
		return computeSunPosition(latitude, longitude, { year, month, day, hour, minute }, offset)
			.azimuthDeg;
	};

	// Nord-orientiert: Bearing 0
	const vectors = buildFanVectors(path, 0, azimuthAt);

	const lines = vectors
		.map(v => {
			const isEvent = v.kind !== 'hour';
			const color = isEvent ? colors.sunRiseSet : colors.sunVector;
			const x2 = CX + v.dx * R;
			const y2 = CY + v.dy * R;
			const lx = CX + v.dx * LABEL_R;
			const ly = CY + v.dy * LABEL_R;
			const text =
				v.kind === 'sunrise'
					? formatHours(path.sunRiseHours)
					: v.kind === 'sunset'
						? formatHours(path.sunSetHours)
						: v.label;
			return (
				`<line x1="${CX}" y1="${CY}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" ` +
				`stroke="${color}" stroke-width="${isEvent ? 2.5 : 1.75}" stroke-linecap="round"/>` +
				`<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" fill="${color}" font-size="${isEvent ? 11 : 12}" ` +
				`font-weight="${isEvent ? 600 : 500}" text-anchor="middle" dominant-baseline="middle">${esc(text)}</text>`
			);
		})
		.join('\n  ');

	const legend = [
		`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`,
		`${day}.${month}.${year} (${timeZone})`,
		`Aufgang ${formatHours(path.sunRiseHours)} · Kulmination ${formatHours(path.sunTransitHours)} · Untergang ${formatHours(path.sunSetHours)}`,
	];

	return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" font-family="system-ui, sans-serif">
  <rect width="${W}" height="${H}" fill="${colors.background}"/>
  <!-- Nordpfeil -->
  <g stroke="${colors.foreground}" fill="${colors.foreground}">
    <line x1="${CX}" y1="${CY - R - 34}" x2="${CX}" y2="${CY - R - 50}" stroke-width="1.5"/>
    <path d="M ${CX} ${CY - R - 54} l 4 8 h -8 z"/>
    <text x="${CX + 10}" y="${CY - R - 44}" font-size="12" font-weight="600" stroke="none">N</text>
  </g>
  <circle cx="${CX}" cy="${CY}" r="3.5" fill="${colors.sunVector}"/>
  ${lines}
  <g fill="${colors.foreground}" font-size="12">
    <text x="${CX}" y="${H - 52}" text-anchor="middle" font-weight="600">Sunrays – Sonnenverlauf</text>
    <text x="${CX}" y="${H - 34}" text-anchor="middle">${esc(legend[0] ?? '')} · ${esc(legend[1] ?? '')}</text>
    <text x="${CX}" y="${H - 16}" text-anchor="middle">${esc(legend[2] ?? '')}</text>
  </g>
</svg>
`;
}
