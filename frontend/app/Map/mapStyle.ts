/**
 * Karten-Style (Story 3.1): OpenFreeMap "Liberty", vor der Übergabe an MapLibre
 * in der Sättigung reduziert, damit sich der Gold/Teal-Fächer klar von der
 * Kartenpalette abhebt. Die Entsättigung passiert im Style selbst (nicht per
 * CSS-Filter), damit der PNG-Export (Canvas-Grab) dieselben Farben zeigt.
 */
import type { StyleSpecification } from 'maplibre-gl';

export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Faktor 0..1, mit dem die Sättigung aller Kartenfarben multipliziert wird. */
export const MAP_SATURATION = 0.45;

/** Start-Zoom (FR2): Strassen-Niveau statt Länder-Übersicht. */
export const STREET_ZOOM = 16;

/**
 * Lädt den Style und entsättigt ihn. Fällt bei Netzwerk-/Parse-Fehlern auf die
 * Style-URL zurück (dann rendert MapLibre die Originalfarben).
 */
export async function loadDesaturatedStyle(): Promise<StyleSpecification | string> {
	try {
		const response = await fetch(MAP_STYLE_URL);
		if (!response.ok) throw new Error(`Style-Request fehlgeschlagen: ${response.status}`);
		const style = (await response.json()) as StyleSpecification;
		return desaturateStyle(style, MAP_SATURATION);
	} catch {
		return MAP_STYLE_URL;
	}
}

/** Entsättigt alle `*color*`-Properties in paint/layout aller Layer. */
export function desaturateStyle(style: StyleSpecification, factor: number): StyleSpecification {
	const layers = style.layers.map(layer => {
		const next = { ...layer } as Record<string, unknown>;
		for (const section of ['paint', 'layout'] as const) {
			const props = (layer as Record<string, unknown>)[section];
			if (!props || typeof props !== 'object') continue;
			next[section] = Object.fromEntries(
				Object.entries(props).map(([key, value]) =>
					key.includes('color') ? [key, mapColorValue(value, factor)] : [key, value],
				),
			);
		}
		return next as unknown as (typeof style.layers)[number];
	});
	return { ...style, layers };
}

/**
 * Wendet die Entsättigung rekursiv an — Farbwerte stecken auch in Expressions
 * (["interpolate", …]) oder Legacy-Funktionen ({stops: [[z, color], …]}).
 * Strings, die nicht wie eine Farbe aussehen (Operatoren, Property-Namen),
 * bleiben unverändert.
 */
function mapColorValue(value: unknown, factor: number): unknown {
	if (typeof value === 'string') return desaturateColor(value, factor);
	if (Array.isArray(value)) return value.map(item => mapColorValue(item, factor));
	if (value && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, item]) => [key, mapColorValue(item, factor)]),
		);
	}
	return value;
}

const HSL_RE =
	/^hsla?\(\s*([\d.]+)(?:deg)?\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i;
const RGB_RE =
	/^rgba?\(\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*[,\s]\s*([\d.]+)\s*(?:[,/]\s*([\d.]+%?)\s*)?\)$/i;
const HEX_RE = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

/** Multipliziert die HSL-Sättigung einer CSS-Farbe mit `factor`. */
export function desaturateColor(color: string, factor: number): string {
	const input = color.trim();

	const hsl = HSL_RE.exec(input);
	if (hsl) {
		const [, h = '0', s = '0', l = '0', alpha] = hsl;
		const newS = clamp01(Number(s) / 100, factor) * 100;
		return alpha === undefined
			? `hsl(${h},${round1(newS)}%,${l}%)`
			: `hsla(${h},${round1(newS)}%,${l}%,${alpha})`;
	}

	const rgb = RGB_RE.exec(input);
	if (rgb) {
		const [, r = '0', g = '0', b = '0', alpha] = rgb;
		const [nr, ng, nb] = desaturateRgb(Number(r), Number(g), Number(b), factor);
		return alpha === undefined ? `rgb(${nr},${ng},${nb})` : `rgba(${nr},${ng},${nb},${alpha})`;
	}

	if (HEX_RE.test(input)) {
		const hex = input.slice(1);
		const short = hex.length <= 4;
		const digits = short ? hex.split('').map(c => c + c) : (hex.match(/../g) ?? []);
		const [r = 0, g = 0, b = 0] = digits.slice(0, 3).map(d => parseInt(d, 16));
		const alphaHex = digits[3];
		const [nr, ng, nb] = desaturateRgb(r, g, b, factor);
		const toHex = (n: number) => n.toString(16).padStart(2, '0');
		return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}${alphaHex ?? ''}`;
	}

	// Kein erkennbares Farbformat (z. B. Expression-Operator) — unverändert lassen
	return color;
}

function clamp01(saturation: number, factor: number): number {
	return Math.min(1, Math.max(0, saturation * factor));
}

function round1(n: number): number {
	return Math.round(n * 10) / 10;
}

function desaturateRgb(r: number, g: number, b: number, factor: number): [number, number, number] {
	const [h, s, l] = rgbToHsl(r, g, b);
	return hslToRgb(h, clamp01(s, factor), l);
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
	const rn = r / 255;
	const gn = g / 255;
	const bn = b / 255;
	const max = Math.max(rn, gn, bn);
	const min = Math.min(rn, gn, bn);
	const l = (max + min) / 2;
	if (max === min) return [0, 0, l];
	const d = max - min;
	const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
	let h: number;
	if (max === rn) h = ((gn - bn) / d + (gn < bn ? 6 : 0)) / 6;
	else if (max === gn) h = ((bn - rn) / d + 2) / 6;
	else h = ((rn - gn) / d + 4) / 6;
	return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
	if (s === 0) {
		const v = Math.round(l * 255);
		return [v, v, v];
	}
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	const channel = (t: number) => {
		let tn = t;
		if (tn < 0) tn += 1;
		if (tn > 1) tn -= 1;
		if (tn < 1 / 6) return p + (q - p) * 6 * tn;
		if (tn < 1 / 2) return q;
		if (tn < 2 / 3) return p + (q - p) * (2 / 3 - tn) * 6;
		return p;
	};
	return [
		Math.round(channel(h + 1 / 3) * 255),
		Math.round(channel(h) * 255),
		Math.round(channel(h - 1 / 3) * 255),
	];
}
