import { LocateButton } from '#/Map/LocateButton';
import { MapView } from '#/Map/MapView';
import { markerAtom, viewModeAtom } from '#/Map/state';
import { readUrlState, writeUrlState } from '#/Map/urlState';
import { SearchBox } from '#/Search/SearchBox';
import { ShareControls } from '#/Sharing/ShareControls';
import { ThemeToggle } from '#/Settings/ThemeToggle';
import { DateControl } from '#/Sun/DateControl';
import { SunFanOverlay } from '#/Sun/SunFanOverlay';
import { dateAtom, formatHours, sunStateAtom } from '#/Sun/state';
import { useAtom, useAtomValue } from 'jotai';
import type maplibregl from 'maplibre-gl';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { MetaFunction } from 'react-router';

export const meta: MetaFunction = () => {
	return [
		{ title: 'Sunrays' },
		{
			name: 'description',
			content: 'Sonnenverlauf für Ort und Datum – Planungstool für DoPs und Fotograf:innen',
		},
	];
};

/**
 * App-Shell (Story 1.3/3.1/3.3/3.4): Map-first-Layout — die Karte füllt den
 * Viewport, alle Controls liegen als ruhige Panels darüber.
 */
export default function Index() {
	const [marker, setMarker] = useAtom(markerAtom);
	const [viewMode, setViewMode] = useAtom(viewModeAtom);
	const [date, setDate] = useAtom(dateAtom);
	const sun = useAtomValue(sunStateAtom);
	const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
	const [map, setMap] = useState<maplibregl.Map | null>(null);
	const [notice, setNotice] = useState<string | null>(null);
	const zoomRef = useRef<number | null>(null);

	// Initialen Zustand aus der URL übernehmen (Vorarbeit FR13)
	useEffect(() => {
		const url = readUrlState(window.location.search);
		if (url.marker) setMarker(url.marker);
		if (url.view) setViewMode(url.view);
		if (url.date) setDate(url.date);
		zoomRef.current = url.zoom;
		setHydratedFromUrl(true);
	}, []);

	const handleMarkerChange = useCallback(
		(pos: { lat: number; lon: number }) => {
			setMarker(pos);
			writeUrlState({ marker: pos });
		},
		[setMarker],
	);

	const handleZoomChange = useCallback((zoom: number) => {
		writeUrlState({ zoom });
	}, []);

	const handleDateChange = useCallback(
		(iso: string) => {
			setDate(iso);
			writeUrlState({ date: iso });
		},
		[setDate],
	);

	const handleViewChange = (mode: '2d' | '3d') => {
		setViewMode(mode);
		writeUrlState({ view: mode });
	};

	const [year = 0, month = 0, day = 0] = date.split('-').map(Number);

	return (
		<div className="relative h-dvh w-full overflow-hidden">
			{/* Karte (Story 3.1) — erst mounten, wenn der URL-State gelesen ist */}
			{hydratedFromUrl ? (
				<MapView
					marker={marker}
					initialZoom={zoomRef.current}
					onMarkerChange={handleMarkerChange}
					onZoomChange={handleZoomChange}
					onMapReady={setMap}
				/>
			) : null}

			{/* Signature-Fächer (Story 3.4) */}
			{map && marker && sun.status === 'ready' && (
				<SunFanOverlay map={map} marker={marker} path={sun.path} date={{ year, month, day }} />
			)}

			{/* Hinweise */}
			{marker === null && (
				<div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center">
					<p className="rounded-panel border border-border bg-card/90 px-4 py-2 text-sm text-card-foreground shadow-sm backdrop-blur">
						Klicke auf die Karte, um das Motiv zu markieren
					</p>
				</div>
			)}
			{sun.status === 'out-of-range' && (
				<div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center">
					<p className="rounded-panel border border-warning/50 bg-card/90 px-4 py-2 text-sm text-card-foreground shadow-sm backdrop-blur">
						{sun.message}
					</p>
				</div>
			)}

			{/* Suche (Story 3.2) */}
			<div className="absolute left-4 top-4 z-10 w-[min(22rem,calc(100%-7rem))]">
				<SearchBox
					onSelect={r => {
						handleMarkerChange({ lat: r.lat, lon: r.lon });
						map?.flyTo({ center: [r.lon, r.lat], zoom: Math.max(map.getZoom(), 13) });
					}}
				/>
			</div>

			{/* Ansicht & Theme */}
			<div className="absolute right-4 top-4 z-10 flex items-center gap-2">
				<div
					role="group"
					aria-label="Ansicht wählen"
					className="flex overflow-hidden rounded-panel border border-border bg-card shadow-sm"
				>
					{(['2d', '3d'] as const).map(mode => (
						<button
							key={mode}
							type="button"
							onClick={() => handleViewChange(mode)}
							aria-pressed={viewMode === mode}
							className={
								'px-4 py-2 text-sm font-medium transition-colors ' +
								(viewMode === mode
									? 'bg-primary text-primary-foreground'
									: 'text-card-foreground hover:bg-muted')
							}
						>
							{mode.toUpperCase()}
						</button>
					))}
				</div>
				<LocateButton
					onLocate={pos => {
						handleMarkerChange(pos);
						map?.flyTo({ center: [pos.lon, pos.lat], zoom: Math.max(map.getZoom(), 15) });
					}}
					onError={message => {
						setNotice(message);
						setTimeout(() => setNotice(null), 5000);
					}}
				/>
				<ThemeToggle />
			</div>

			{notice && (
				<div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center">
					<p
						role="status"
						className="rounded-panel border border-warning/50 bg-card/90 px-4 py-2 text-sm text-card-foreground shadow-sm backdrop-blur"
					>
						{notice}
					</p>
				</div>
			)}

			{/* Export & Sharing (Epic 5) */}
			<div className="absolute bottom-4 right-4 z-10 max-sm:bottom-24">
				<ShareControls map={map} marker={marker} sun={sun} />
			</div>

			{/* Datum & Tagesdaten (Story 3.3/3.4) */}
			<div className="absolute bottom-4 left-1/2 z-10 flex w-[min(34rem,calc(100%-2rem))] -translate-x-1/2 flex-col items-center gap-2">
				{sun.status === 'ready' && (
					<p className="rounded-panel border border-border bg-card/90 px-4 py-1.5 text-sm text-card-foreground shadow-sm backdrop-blur">
						<span className="text-sun-riseset">↑ {formatHours(sun.path.sunRiseHours)}</span>
						<span className="mx-2 text-muted-foreground">·</span>
						<span>Kulmination {formatHours(sun.path.sunTransitHours)}</span>
						<span className="mx-2 text-muted-foreground">·</span>
						<span className="text-sun-riseset">↓ {formatHours(sun.path.sunSetHours)}</span>
						<span className="ml-2 text-xs text-muted-foreground">({sun.timeZone})</span>
					</p>
				)}
				<DateControl value={date} onChange={handleDateChange} />
			</div>
		</div>
	);
}
