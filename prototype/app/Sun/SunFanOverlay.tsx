/**
 * Signature-Fächer als Overlay über der 2D-Karte (Story 3.4, FR7).
 * Screen-space-SVG: Der Fächer behält konstante Bildschirmgröße und wird bei
 * jeder Kartenbewegung neu am Marker verankert (Position via map.project),
 * Rotation folgt dem Karten-Bearing.
 */
import type { MarkerPosition } from '#/Map/state';
import { buildFanVectors } from '#/Sun/fanGeometry';
import { formatHours } from '#/Sun/state';
import { computeSunPosition, type SunPath } from '@repo/solar';
import type maplibregl from 'maplibre-gl';
import { useEffect, useState } from 'react';

const FAN_RADIUS = 120;
const LABEL_RADIUS = FAN_RADIUS + 16;

export interface SunFanOverlayProps {
	map: maplibregl.Map;
	marker: MarkerPosition;
	path: SunPath;
	date: { year: number; month: number; day: number };
}

export function SunFanOverlay({ map, marker, path, date }: SunFanOverlayProps) {
	const [view, setView] = useState(() => ({
		point: map.project([marker.lon, marker.lat]),
		bearing: map.getBearing(),
	}));

	useEffect(() => {
		const update = () =>
			setView({ point: map.project([marker.lon, marker.lat]), bearing: map.getBearing() });
		update();
		map.on('move', update);
		return () => {
			map.off('move', update);
		};
	}, [map, marker.lon, marker.lat]);

	const azimuthAt = (decimalHours: number) => {
		const hour = Math.floor(decimalHours);
		const minute = Math.floor((decimalHours - hour) * 60);
		const second = Math.round(((decimalHours - hour) * 60 - minute) * 60);
		const offset =
			path.hours[Math.min(Math.max(hour, 0), 23)]?.utcOffsetHours ??
			path.hours[12]?.utcOffsetHours ??
			0;
		return computeSunPosition(marker.lat, marker.lon, { ...date, hour, minute, second }, offset)
			.azimuthDeg;
	};

	const vectors = buildFanVectors(path, view.bearing, azimuthAt);
	if (vectors.length === 0) return null;

	const { x: cx, y: cy } = view.point;

	return (
		<svg
			aria-hidden
			className="pointer-events-none absolute inset-0 z-[5] h-full w-full overflow-visible"
			data-testid="sun-fan"
		>
			{vectors.map(v => {
				const isEvent = v.kind !== 'hour';
				const color = isEvent ? 'var(--sun-riseset)' : 'var(--sun-vector)';
				const x2 = cx + v.dx * FAN_RADIUS;
				const y2 = cy + v.dy * FAN_RADIUS;
				const lx = cx + v.dx * LABEL_RADIUS;
				const ly = cy + v.dy * LABEL_RADIUS;
				const text =
					v.kind === 'sunrise'
						? formatHours(path.sunRiseHours)
						: v.kind === 'sunset'
							? formatHours(path.sunSetHours)
							: v.label;
				return (
					<g key={`${v.kind}-${v.label}-${v.azimuthDeg.toFixed(2)}`}>
						<line
							x1={cx}
							y1={cy}
							x2={x2}
							y2={y2}
							stroke={color}
							strokeWidth={isEvent ? 2.5 : 1.75}
							strokeDasharray={isEvent ? undefined : undefined}
							strokeLinecap="round"
							opacity={0.95}
						/>
						<text
							x={lx}
							y={ly}
							fill={color}
							fontSize={isEvent ? 11 : 12}
							fontWeight={isEvent ? 600 : 500}
							textAnchor="middle"
							dominantBaseline="middle"
							paintOrder="stroke"
							stroke="var(--background)"
							strokeWidth={3}
						>
							{text}
						</text>
					</g>
				);
			})}
			{/* Zentrum */}
			<circle cx={cx} cy={cy} r={3} fill="var(--sun-vector)" opacity={0.9} />
		</svg>
	);
}
