/**
 * 2D-Karte (Story 3.1, FR2): MapLibre GL JS mit OpenFreeMap-Vector-Tiles.
 * Der Style wird vor der Übergabe entsättigt (siehe mapStyle.ts), damit sich
 * der Fächer farblich abhebt. Klick/Tap setzt den Marker, Drag verschiebt ihn;
 * jede Änderung wird nach oben gemeldet (State + URL). "Pin sitzt"-Feedback
 * per kurzer Drop-Animation.
 */
import { loadDesaturatedStyle, STREET_ZOOM } from '#/Map/mapStyle';
import type { MarkerPosition } from '#/Map/state';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef, useState } from 'react';

/** Startausschnitt, wenn kein URL-State vorhanden ist (Zürich, Strassen-Niveau). */
const DEFAULT_CENTER: [number, number] = [8.5417, 47.3769];

export interface MapViewProps {
	marker: MarkerPosition | null;
	initialZoom?: number | null;
	onMarkerChange: (marker: MarkerPosition) => void;
	onZoomChange?: (zoom: number) => void;
	/** Liefert die Map-Instanz nach der Initialisierung (für Overlays). */
	onMapReady?: (map: maplibregl.Map) => void;
}

function createMarkerElement(): HTMLDivElement {
	const el = document.createElement('div');
	el.className = 'sunrays-marker';
	el.setAttribute('aria-label', 'Motiv-Standort');
	return el;
}

export function MapView({
	marker,
	initialZoom,
	onMarkerChange,
	onZoomChange,
	onMapReady,
}: MapViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const mapRef = useRef<maplibregl.Map | null>(null);
	const markerRef = useRef<maplibregl.Marker | null>(null);
	const callbacksRef = useRef({ onMarkerChange, onZoomChange, onMapReady });
	callbacksRef.current = { onMarkerChange, onZoomChange, onMapReady };
	// Triggert den Marker-Sync, sobald die (asynchron erzeugte) Map steht
	const [mapCreated, setMapCreated] = useState(false);

	// Karte initialisieren (einmalig; Style wird vorab geladen und entsättigt)
	useEffect(() => {
		if (!containerRef.current || mapRef.current) return;
		let cancelled = false;
		let map: maplibregl.Map | null = null;

		void loadDesaturatedStyle().then(style => {
			if (cancelled || !containerRef.current || mapRef.current) return;

			map = new maplibregl.Map({
				container: containerRef.current,
				style,
				center: marker ? [marker.lon, marker.lat] : DEFAULT_CENTER,
				zoom: initialZoom ?? STREET_ZOOM,
				attributionControl: { compact: false },
				// PNG-Export (Story 5.1): Canvas muss nach dem Rendern lesbar bleiben
				canvasContextAttributes: { preserveDrawingBuffer: true },
			});
			map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

			map.on('click', e => {
				callbacksRef.current.onMarkerChange({ lat: e.lngLat.lat, lon: e.lngLat.lng });
			});
			map.on('zoomend', () => {
				callbacksRef.current.onZoomChange?.(map?.getZoom() ?? 0);
			});

			mapRef.current = map;
			setMapCreated(true);
			callbacksRef.current.onMapReady?.(map);
		});

		return () => {
			cancelled = true;
			markerRef.current = null;
			mapRef.current = null;
			map?.remove();
		};
	}, []);

	// Marker mit dem State synchron halten
	useEffect(() => {
		const map = mapRef.current;
		if (!map || !marker) return;

		if (!markerRef.current) {
			const m = new maplibregl.Marker({
				element: createMarkerElement(),
				draggable: true,
				anchor: 'bottom',
			})
				.setLngLat([marker.lon, marker.lat])
				.addTo(map);
			m.on('dragend', () => {
				const pos = m.getLngLat();
				callbacksRef.current.onMarkerChange({ lat: pos.lat, lon: pos.lng });
			});
			markerRef.current = m;
		} else {
			markerRef.current.setLngLat([marker.lon, marker.lat]);
		}

		// "Pin sitzt"-Feedback (UX-Spec 2.3)
		const el = markerRef.current.getElement();
		el.classList.remove('sunrays-marker-drop');
		// Reflow erzwingen, damit die Animation erneut startet
		void el.offsetWidth;
		el.classList.add('sunrays-marker-drop');
	}, [marker, mapCreated]);

	// Wrapper nötig: MapLibre setzt auf den Container selbst `position: relative`
	// (Klasse maplibregl-map) und würde `absolute inset-0` überschreiben.
	return (
		<div className="absolute inset-0">
			<div ref={containerRef} className="h-full w-full" data-testid="map-canvas" />
		</div>
	);
}
