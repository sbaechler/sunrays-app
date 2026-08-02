/**
 * i18n (FR16): Sprachwechsel per Toggle, Persistenz über Reload und
 * lokalisierte Rechtsseite. Browser-Locale ist de-DE (playwright.config.ts),
 * daher startet die App auf Deutsch.
 */
import { expect, test } from '@playwright/test';

test('Sprachwechsel auf Englisch und Persistenz über Reload', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('combobox', { name: 'Ort suchen' })).toBeVisible({
		timeout: 20_000,
	});
	await expect(page.locator('html')).toHaveAttribute('lang', 'de');

	await page.getByRole('button', { name: 'Sprache wechseln' }).click();
	await page.getByRole('option', { name: 'English' }).click();
	await expect(page.getByRole('combobox', { name: 'Search location' })).toBeVisible();
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');

	// Override ist in localStorage persistiert
	await page.reload();
	await expect(page.getByRole('combobox', { name: 'Search location' })).toBeVisible({
		timeout: 20_000,
	});
	await expect(page.locator('html')).toHaveAttribute('lang', 'en');
});

test('Rechtsseite folgt der gewählten Sprache', async ({ page }) => {
	await page.goto('/rechtliches');
	await expect(page.getByRole('heading', { name: 'Datenschutzerklärung', level: 1 })).toBeVisible({
		timeout: 20_000,
	});

	await page.goto('/');
	await page.getByRole('button', { name: 'Sprache wechseln' }).click();
	await page.getByRole('option', { name: 'English' }).click();
	await page.getByRole('link', { name: 'Legal: privacy policy and terms of use' }).click();
	await expect(page.getByRole('heading', { name: 'Privacy policy', level: 1 })).toBeVisible();
	await expect(page.getByText('the German version prevails')).toBeVisible();
});
