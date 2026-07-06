/**
 * 2D-Karte (Story 3.1, FR2): MapLibre GL JS mit OpenFreeMap-Vector-Tiles.
 * Klick/Tap setzt den Marker, Drag verschiebt ihn; jede Änderung wird nach
 * oben gemeldet (State + URL). "Pin sitzt"-Feedback per kurzer Drop-Animation.
 */
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useEffect, useRef } from 'react';
import type { MarkerPosition } from '#/Map/state';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Startausschnitt, wenn kein URL-State vorhanden ist (Mitteleuropa). */
const DEFAULT_CENTER: [number, number] = [8.5417, 47.3769];
const DEFAULT_ZOOM = 5;

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

  // Karte initialisieren (einmalig)
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: MAP_STYLE_URL,
      center: marker ? [marker.lon, marker.lat] : DEFAULT_CENTER,
      zoom: initialZoom ?? (marker ? 14 : DEFAULT_ZOOM),
      attributionControl: { compact: false },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right');

    map.on('click', (e) => {
      callbacksRef.current.onMarkerChange({ lat: e.lngLat.lat, lon: e.lngLat.lng });
    });
    map.on('zoomend', () => {
      callbacksRef.current.onZoomChange?.(map.getZoom());
    });

    mapRef.current = map;
    callbacksRef.current.onMapReady?.(map);
    return () => {
      markerRef.current = null;
      mapRef.current = null;
      map.remove();
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
  }, [marker]);

  // Wrapper nötig: MapLibre setzt auf den Container selbst `position: relative`
  // (Klasse maplibregl-map) und würde `absolute inset-0` überschreiben.
  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" data-testid="map-canvas" />
    </div>
  );
}
