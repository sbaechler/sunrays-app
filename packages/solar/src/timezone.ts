/**
 * Zeitzonen-Ermittlung aus der Marker-Position (Story 2.3, FR4/NFR4).
 *
 * - `timezoneAt(lat, lon)`: IANA-Zeitzonen-ID aus Koordinaten (tz-lookup).
 * - `utcOffsetHoursAt(timeZone, local)`: UTC-Offset einer lokalen Wanduhrzeit,
 *   DST-korrekt via `Intl` (ersetzt Legacy `dst.py`).
 *
 * Verhalten an DST-Kanten: nicht existente Zeiten (Frühjahrs-Sprunglücke)
 * werden mit dem Offset VOR der Umstellung interpretiert (entspricht
 * Python zoneinfo, fold=0 — so wurden auch die Golden-Fixtures erzeugt).
 */
import tzLookup from '@photostructure/tz-lookup';
import type { LocalDateTime } from './solar.js';

/** IANA-Zeitzonen-ID für eine Koordinate (z. B. "Europe/Zurich"). */
export function timezoneAt(latDeg: number, lonDeg: number): string {
	return tzLookup(latDeg, lonDeg);
}

const dtfCache = new Map<string, Intl.DateTimeFormat>();

function getFormatter(timeZone: string): Intl.DateTimeFormat {
	let dtf = dtfCache.get(timeZone);
	if (!dtf) {
		dtf = new Intl.DateTimeFormat('en-US', {
			timeZone,
			hour12: false,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		});
		dtfCache.set(timeZone, dtf);
	}
	return dtf;
}

/** UTC-Offset (Millisekunden) der Zone zu einem UTC-Zeitpunkt. */
function offsetMsAtInstant(timeZone: string, utcMs: number): number {
	const parts = getFormatter(timeZone).formatToParts(new Date(utcMs));
	const get = (type: Intl.DateTimeFormatPartTypes): number => {
		const p = parts.find(x => x.type === type);
		return p ? Number(p.value) : 0;
	};
	// Intl liefert "24" für Mitternacht bei hourCycle h24-Fallback — normalisieren
	const hour = get('hour') % 24;
	const asUTC = Date.UTC(
		get('year'),
		get('month') - 1,
		get('day'),
		hour,
		get('minute'),
		get('second'),
	);
	return asUTC - utcMs;
}

/**
 * UTC-Offset (Stunden) für eine lokale Wanduhrzeit in einer IANA-Zone.
 * Zwei-Schritt-Verfahren: Offset am naiven UTC-Zeitpunkt bestimmen, damit den
 * Kandidaten-UTC-Zeitpunkt bilden und den Offset dort erneut ablesen.
 */
export function utcOffsetHoursAt(timeZone: string, local: LocalDateTime): number {
	const naiveUtcMs = Date.UTC(
		local.year,
		local.month - 1,
		local.day,
		local.hour,
		local.minute ?? 0,
		local.second ?? 0,
	);
	const guess = offsetMsAtInstant(timeZone, naiveUtcMs);
	const refined = offsetMsAtInstant(timeZone, naiveUtcMs - guess);
	return refined / 3600_000;
}

/** Bequemlichkeits-Kombination: Offset direkt aus Koordinaten. */
export function utcOffsetHoursAtPosition(
	latDeg: number,
	lonDeg: number,
	local: LocalDateTime,
): { timeZone: string; utcOffsetHours: number } {
	const timeZone = timezoneAt(latDeg, lonDeg);
	return { timeZone, utcOffsetHours: utcOffsetHoursAt(timeZone, local) };
}
