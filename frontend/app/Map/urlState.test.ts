import { describe, expect, it } from 'vitest';
import { readUrlState } from './urlState';

describe('readUrlState', () => {
	it('liest Marker, Zoom, Ansicht und Datum', () => {
		const state = readUrlState('?lat=47.3769&lon=8.5417&z=14.5&v=3d&d=2026-07-30');
		expect(state.marker).toEqual({ lat: 47.3769, lon: 8.5417 });
		expect(state.zoom).toBe(14.5);
		expect(state.view).toBe('3d');
		expect(state.date).toBe('2026-07-30');
	});

	it('liest den vertikalen Marker-Versatz (h)', () => {
		const state = readUrlState('?lat=47.3769&lon=8.5417&h=12.5');
		expect(state.marker).toEqual({ lat: 47.3769, lon: 8.5417, heightOffset: 12.5 });
	});

	it('ignoriert ungültige oder nicht-positive h-Werte', () => {
		expect(readUrlState('?lat=1&lon=2&h=0').marker).toEqual({ lat: 1, lon: 2 });
		expect(readUrlState('?lat=1&lon=2&h=-5').marker).toEqual({ lat: 1, lon: 2 });
		expect(readUrlState('?lat=1&lon=2&h=abc').marker).toEqual({ lat: 1, lon: 2 });
	});

	it('ignoriert h ohne gültigen Marker', () => {
		expect(readUrlState('?h=12').marker).toBeNull();
	});
});
