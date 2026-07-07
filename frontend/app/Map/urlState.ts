/**
 * URL-State (Vorarbeit FR13): Marker, Zoom und Ansicht sind in den
 * Query-Parametern kodiert, damit jede Ansicht als Link teilbar ist.
 * Format: ?lat=47.37690&lon=8.54170&z=14.5&v=2d
 */
import type { MarkerPosition, ViewMode } from '#/Map/state';

export interface UrlState {
	marker: MarkerPosition | null;
	zoom: number | null;
	view: ViewMode | null;
	/** ISO-Datum YYYY-MM-DD */
	date: string | null;
}

export function readUrlState(search: string): UrlState {
	const params = new URLSearchParams(search);
	const lat = Number(params.get('lat'));
	const lon = Number(params.get('lon'));
	const zoom = Number(params.get('z'));
	const view = params.get('v');
	return {
		marker:
			Number.isFinite(lat) && Number.isFinite(lon) && params.has('lat') && params.has('lon')
				? { lat, lon }
				: null,
		zoom: Number.isFinite(zoom) && params.has('z') ? zoom : null,
		view: view === '2d' || view === '3d' ? view : null,
		date: /^\d{4}-\d{2}-\d{2}$/.test(params.get('d') ?? '') ? params.get('d') : null,
	};
}

/** Schreibt nur die übergebenen Schlüssel; `marker: null` entfernt den Marker. */
export function writeUrlState(state: {
	marker?: MarkerPosition | null;
	zoom?: number;
	view?: ViewMode;
	date?: string;
}): void {
	const params = new URLSearchParams(window.location.search);
	if (state.marker !== undefined) {
		if (state.marker) {
			params.set('lat', state.marker.lat.toFixed(5));
			params.set('lon', state.marker.lon.toFixed(5));
		} else {
			params.delete('lat');
			params.delete('lon');
		}
	}
	if (state.zoom !== undefined) params.set('z', state.zoom.toFixed(2));
	if (state.view) params.set('v', state.view);
	if (state.date) params.set('d', state.date);
	const query = params.toString();
	window.history.replaceState(null, '', query ? `?${query}` : window.location.pathname);
}
