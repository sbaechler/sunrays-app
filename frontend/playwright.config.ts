import { defineConfig, devices } from '@playwright/test';

/**
 * E2E-Smoke (QS): baut die App und serviert den SPA-Build via `vite preview`.
 * Läuft lokal wie in CI; Karten-Tiles kommen live von OpenFreeMap.
 */
export default defineConfig({
	testDir: './e2e',
	timeout: 60_000,
	retries: process.env.CI ? 2 : 0,
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		// Deutsche Browser-Locale: prüft implizit die i18n-Autodetektion (FR16)
		locale: 'de-DE',
		trace: 'on-first-retry',
	},
	projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
	webServer: {
		command: 'npm run build && npm run preview -- --port 4173 --strictPort',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 180_000,
	},
});
