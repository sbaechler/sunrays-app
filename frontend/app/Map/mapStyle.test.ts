import type { StyleSpecification } from 'maplibre-gl';
import { describe, expect, it } from 'vitest';
import { desaturateColor, desaturateStyle } from './mapStyle';

describe('desaturateColor', () => {
	it('reduziert die Sättigung von hsl()-Farben', () => {
		expect(desaturateColor('hsl(30, 80%, 50%)', 0.5)).toBe('hsl(30,40%,50%)');
		expect(desaturateColor('hsla(200, 60%, 40%, 0.8)', 0.5)).toBe('hsla(200,30%,40%,0.8)');
	});

	it('unterstützt die Space-Syntax von hsl()', () => {
		expect(desaturateColor('hsl(30 80% 50%)', 0.5)).toBe('hsl(30,40%,50%)');
	});

	it('entsättigt Hex-Farben (inkl. Kurzform und Alpha)', () => {
		// #ff0000 (S=100%) → Faktor 0.5 → S=50% bei L=50% → #bf4040
		expect(desaturateColor('#ff0000', 0.5)).toBe('#bf4040');
		expect(desaturateColor('#f00', 0.5)).toBe('#bf4040');
		expect(desaturateColor('#ff000080', 0.5)).toBe('#bf404080');
	});

	it('entsättigt rgb()/rgba()-Farben', () => {
		expect(desaturateColor('rgb(255, 0, 0)', 0.5)).toBe('rgb(191,64,64)');
		expect(desaturateColor('rgba(255, 0, 0, 0.5)', 0.5)).toBe('rgba(191,64,64,0.5)');
	});

	it('lässt Graustufen unverändert', () => {
		expect(desaturateColor('#808080', 0.5)).toBe('#808080');
	});

	it('lässt Nicht-Farb-Strings unverändert (Expression-Operatoren)', () => {
		expect(desaturateColor('interpolate', 0.5)).toBe('interpolate');
		expect(desaturateColor('grass', 0.5)).toBe('grass');
	});
});

describe('desaturateStyle', () => {
	it('transformiert Farb-Properties inkl. verschachtelter Expressions', () => {
		const style = {
			version: 8,
			sources: {},
			layers: [
				{
					id: 'water',
					type: 'fill',
					paint: {
						'fill-color': 'hsl(200, 80%, 50%)',
						'fill-opacity': 0.9,
					},
				},
				{
					id: 'roads',
					type: 'line',
					paint: {
						'line-color': [
							'interpolate',
							['linear'],
							['zoom'],
							5,
							'#ff0000',
							10,
							{ stops: [[12, 'rgb(255, 0, 0)']] },
						],
						'line-width': 2,
					},
				},
			],
		} as unknown as StyleSpecification;

		const result = desaturateStyle(style, 0.5);
		const [water, roads] = result.layers as unknown as [
			{ paint: Record<string, unknown> },
			{ paint: Record<string, unknown> },
		];
		expect(water.paint['fill-color']).toBe('hsl(200,40%,50%)');
		expect(water.paint['fill-opacity']).toBe(0.9); // Nicht-Farbe unangetastet
		const lineColor = roads.paint['line-color'] as unknown[];
		expect(lineColor[0]).toBe('interpolate'); // Operator unangetastet
		expect(lineColor[4]).toBe('#bf4040');
		expect((lineColor[6] as { stops: [[number, string]] }).stops[0][1]).toBe('rgb(191,64,64)');
		expect(roads.paint['line-width']).toBe(2);
		// Original nicht mutiert
		expect((style.layers[0] as { paint: Record<string, unknown> }).paint['fill-color']).toBe(
			'hsl(200, 80%, 50%)',
		);
	});
});
