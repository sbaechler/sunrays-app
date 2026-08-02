import { defineConfig } from '@lingui/cli';
import { formatter } from '@lingui/format-po';

export default defineConfig({
	sourceLocale: 'de',
	locales: ['de', 'en', 'fr', 'it', 'es', 'ru', 'zh'],
	catalogs: [
		{
			path: '<rootDir>/app/locales/{locale}/messages',
			include: ['app'],
			// Rechtsprosa wird als eigene Locale-Komponenten gepflegt, nicht im Katalog
			exclude: ['**/node_modules/**', 'app/routes/rechtliches/**'],
		},
	],
	format: formatter({ lineNumbers: false }),
});
