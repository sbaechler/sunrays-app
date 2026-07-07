/**
 * Smoke-Test (QS): der Kern-Flow — Ansicht öffnen mit Marker+Datum aus der
 * URL, Sonnen-Daten sichtbar, Karte gerendert, Export-Buttons aktiv.
 * Bewusst schmal gehalten: keine 3D-Prüfung (ion-Token in CI nicht gesetzt),
 * kein Tile-Pixel-Vergleich (Netz-abhängig).
 */
import { expect, test } from '@playwright/test';

const ZURICH = '/?lat=47.3769&lon=8.5417&date=2026-07-07&view=2d';

test('zeigt Sonnenverlauf für Ort und Datum aus der URL', async ({ page }) => {
	await page.goto(ZURICH);

	// Tagesdaten aus der Engine (kein Netz nötig): Auf-/Untergang + Kulmination.
	// Grosszügiges Timeout: Kaltstart lädt Chunks + hydratisiert erst.
	await expect(page.getByText('Kulmination')).toBeVisible({ timeout: 20_000 });
	await expect(page.getByText('↑ 05:37')).toBeVisible();
	await expect(page.getByText('↓ 21:24')).toBeVisible();
	await expect(page.getByText('(Europe/Zurich)')).toBeVisible();

	// Karte gemountet, Fächer-Overlay am Marker
	await expect(page.getByTestId('map-canvas').locator('canvas')).toBeVisible({ timeout: 30_000 });
	await expect(page.locator('.sunrays-marker')).toBeVisible();

	// Exporte werden aktiv, sobald die Karte bereit ist
	await expect(page.getByRole('button', { name: /PNG/ })).toBeEnabled({ timeout: 30_000 });
	await expect(page.getByRole('button', { name: /SVG/ })).toBeEnabled();

	// SVG-Export liefert eine Datei (netzunabhängig, reiner Fächer)
	const downloadPromise = page.waitForEvent('download');
	await page.getByRole('button', { name: /SVG/ }).click();
	const download = await downloadPromise;
	expect(download.suggestedFilename()).toBe('sunrays_2026-07-07_47.3769_8.5417.svg');
});

test('Datumswechsel aktualisiert die Tagesdaten', async ({ page }) => {
	await page.goto(ZURICH);
	await expect(page.getByText('↑ 05:37')).toBeVisible();
	await page.getByRole('button', { name: /Nächster Tag|Next day/ }).click();
	await expect(page.getByText('↑ 05:38')).toBeVisible();
});

test('unbekannte Route zeigt die Fallback-Seite', async ({ page }) => {
	await page.goto('/gibt-es-nicht');
	await expect(page.getByText(/Page not found|Seite nicht gefunden/)).toBeVisible();
});
