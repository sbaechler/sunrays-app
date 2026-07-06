/**
 * Geocoding-Adapter (Story 3.2, FR1): Provider hinter gemeinsamem Interface.
 * - Geoapify (primär lt. Architektur), aktiv sobald VITE_GEOAPIFY_KEY gesetzt
 * - Photon/komoot (key-los) als Default/Fallback
 * Nominatim wird bewusst NICHT für Autocomplete genutzt (Policy-Verbot).
 */

export interface GeocodingResult {
	label: string;
	lat: number;
	lon: number;
}

export interface GeocodingProvider {
	name: string;
	search(query: string, signal: AbortSignal): Promise<GeocodingResult[]>;
}

/** Photon liefert Stadt/Kanton/Bezirk oft mit identischem Label — deduplizieren. */
export function dedupeByLabel(results: GeocodingResult[]): GeocodingResult[] {
	const seen = new Set<string>();
	return results.filter(r => {
		if (seen.has(r.label)) return false;
		seen.add(r.label);
		return true;
	});
}

const LIMIT = 5;

export const photonProvider: GeocodingProvider = {
	name: 'photon',
	async search(query, signal) {
		const url = new URL('https://photon.komoot.io/api');
		url.searchParams.set('q', query);
		url.searchParams.set('limit', String(LIMIT));
		url.searchParams.set('lang', 'de');
		const res = await fetch(url, { signal });
		if (!res.ok) throw new Error(`Photon: HTTP ${res.status}`);
		const data = (await res.json()) as {
			features?: {
				geometry?: { coordinates?: [number, number] };
				properties?: Record<string, string | undefined>;
			}[];
		};
		return dedupeByLabel(
			(data.features ?? [])
				.map(f => {
					const [lon, lat] = f.geometry?.coordinates ?? [];
					const p = f.properties ?? {};
					const label = [p.name, p.city && p.city !== p.name ? p.city : undefined, p.country]
						.filter(Boolean)
						.join(', ');
					return lat !== undefined && lon !== undefined && label ? { label, lat, lon } : null;
				})
				.filter((r): r is GeocodingResult => r !== null),
		);
	},
};

export function geoapifyProvider(apiKey: string): GeocodingProvider {
	return {
		name: 'geoapify',
		async search(query, signal) {
			const url = new URL('https://api.geoapify.com/v1/geocode/autocomplete');
			url.searchParams.set('text', query);
			url.searchParams.set('limit', String(LIMIT));
			url.searchParams.set('lang', 'de');
			url.searchParams.set('format', 'json');
			url.searchParams.set('apiKey', apiKey);
			const res = await fetch(url, { signal });
			if (!res.ok) throw new Error(`Geoapify: HTTP ${res.status}`);
			const data = (await res.json()) as {
				results?: { formatted?: string; lat?: number; lon?: number }[];
			};
			return (data.results ?? [])
				.map(r =>
					r.lat !== undefined && r.lon !== undefined && r.formatted
						? { label: r.formatted, lat: r.lat, lon: r.lon }
						: null,
				)
				.filter((r): r is GeocodingResult => r !== null);
		},
	};
}

/** Aktiver Provider: Geoapify mit Key, sonst Photon. */
export function getGeocodingProvider(): GeocodingProvider {
	const key = import.meta.env.VITE_GEOAPIFY_KEY as string | undefined;
	return key ? geoapifyProvider(key) : photonProvider;
}
