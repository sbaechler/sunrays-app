/**
 * Tests für Zeitzonen-Lookup und DST-Behandlung (Story 2.3, NFR4).
 * Nutzt die Golden-Fixtures als Referenz: dort ist für jede lokale Stunde der
 * via Python zoneinfo (fold=0) bestimmte UTC-Offset hinterlegt.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { timezoneAt, utcOffsetHoursAt } from './timezone.js';

const fixturePath = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'golden',
	'sun-golden-fixtures.json',
);

interface Fixture {
	locations: {
		name: string;
		latitude: number;
		longitude: number;
		timezone: string;
		cases: { date: string; hours: { localTime: string; utcOffsetHours: number }[] }[];
	}[];
}

const fixture: Fixture = JSON.parse(readFileSync(fixturePath, 'utf-8'));

describe('timezoneAt: IANA-Zone aus Koordinaten', () => {
	for (const loc of fixture.locations) {
		it(`${loc.name} -> ${loc.timezone}`, () => {
			expect(timezoneAt(loc.latitude, loc.longitude)).toBe(loc.timezone);
		});
	}
});

describe('utcOffsetHoursAt: DST-korrekte Offsets (Referenz: zoneinfo fold=0)', () => {
	for (const loc of fixture.locations) {
		it(loc.name, () => {
			for (const c of loc.cases) {
				const [year = 0, month = 0, day = 0] = c.date.split('-').map(Number);
				for (const h of c.hours) {
					const hour = Number(h.localTime.slice(0, 2));
					const got = utcOffsetHoursAt(loc.timezone, { year, month, day, hour });
					expect(got, `${loc.name} ${c.date} ${h.localTime}`).toBe(h.utcOffsetHours);
				}
			}
		});
	}
});

describe('Sonderfälle', () => {
	it('Kathmandu: UTC+5:45', () => {
		expect(utcOffsetHoursAt('Asia/Kathmandu', { year: 2026, month: 6, day: 21, hour: 12 })).toBe(
			5.75,
		);
	});

	it('EU-Frühjahrsumstellung: 2026-03-29 vor/nach der Lücke (Europe/Zurich)', () => {
		expect(utcOffsetHoursAt('Europe/Zurich', { year: 2026, month: 3, day: 29, hour: 1 })).toBe(1);
		expect(utcOffsetHoursAt('Europe/Zurich', { year: 2026, month: 3, day: 29, hour: 3 })).toBe(2);
		// nicht existente Stunde 02:xx -> Offset vor der Umstellung (fold=0)
		expect(utcOffsetHoursAt('Europe/Zurich', { year: 2026, month: 3, day: 29, hour: 2 })).toBe(1);
	});

	it('Datumsgrenze: Kiritimati UTC+14, Apia UTC+13', () => {
		expect(
			utcOffsetHoursAt('Pacific/Kiritimati', { year: 2026, month: 6, day: 21, hour: 12 }),
		).toBe(14);
		expect(utcOffsetHoursAt('Pacific/Apia', { year: 2026, month: 6, day: 21, hour: 12 })).toBe(13);
	});

	it("Halbstunden-Zone mit DST: St. John's (America/St_Johns)", () => {
		expect(utcOffsetHoursAt('America/St_Johns', { year: 2026, month: 1, day: 15, hour: 12 })).toBe(
			-3.5,
		);
		expect(utcOffsetHoursAt('America/St_Johns', { year: 2026, month: 6, day: 21, hour: 12 })).toBe(
			-2.5,
		);
	});
});
