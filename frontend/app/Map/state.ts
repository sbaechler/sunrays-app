import { atom } from 'jotai';

/** Marker-Position (Motiv-Standort, FR2). */
export interface MarkerPosition {
	lat: number;
	lon: number;
	/**
	 * Vertikaler Versatz in Metern über Grund (3D-Ansicht): erlaubt es, den
	 * Marker z. B. auf ein Dach zu heben. Fehlend/0 = auf Geländehöhe.
	 */
	heightOffset?: number;
}

export const markerAtom = atom<MarkerPosition | null>(null);

/** Aktive Ansicht (FR9); 3D folgt in Epic 4. */
export type ViewMode = '2d' | '3d';
export const viewModeAtom = atom<ViewMode>('2d');
