/**
 * Locale-Verwaltung (FR16): automatische Wahl per Browser-Sprache
 * (navigator.language spiegelt den Accept-Language-Header), manueller
 * Override persistiert in localStorage. Übersetzungen via Lingui; die
 * .po-Kataloge werden vom Vite-Plugin build-seitig kompiliert (CSP-safe)
 * und pro Sprache als eigener Chunk lazy geladen. Bis der Katalog da ist,
 * rendert Lingui die msgid — das ist der deutsche Quelltext (kein Flash
 * für DE; kurzer DE-Fallback für andere Sprachen).
 */
import { i18n } from '@lingui/core';
import { atom } from 'jotai';

export type Locale = 'de' | 'en' | 'fr' | 'it' | 'es' | 'ru' | 'zh';

export const LOCALES: Locale[] = ['de', 'en', 'fr', 'it', 'es', 'ru', 'zh'];

/** Eigenname der Sprache — bewusst nicht übersetzt (Endonym). */
export const LOCALE_LABELS: Record<Locale, string> = {
	de: 'Deutsch',
	en: 'English',
	fr: 'Français',
	it: 'Italiano',
	es: 'Español',
	ru: 'Русский',
	zh: '中文',
};

const STORAGE_KEY = 'sunrays-locale';

i18n.load('de', {});
i18n.activate('de'); // Source-Locale; wird beim Mount korrigiert

async function activateLocale(locale: Locale): Promise<void> {
	// Vite bündelt jede Sprache als eigenen Chunk und lädt nur die aktive
	const { messages } = await import(`../locales/${locale}/messages.po`);
	i18n.loadAndActivate({ locale, messages });
}

export function detectLocale(): Locale {
	if (typeof window === 'undefined') return 'de';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (LOCALES.includes(stored as Locale)) return stored as Locale;
	const browser = navigator.language.toLowerCase().slice(0, 2);
	return LOCALES.includes(browser as Locale) ? (browser as Locale) : 'en';
}

const baseLocaleAtom = atom<Locale>('de');
baseLocaleAtom.onMount = set => {
	const locale = detectLocale();
	void activateLocale(locale);
	document.documentElement.lang = locale;
	set(locale);
};

export const localeAtom = atom(
	get => get(baseLocaleAtom),
	(_get, set, locale: Locale) => {
		localStorage.setItem(STORAGE_KEY, locale);
		document.documentElement.lang = locale;
		void activateLocale(locale);
		set(baseLocaleAtom, locale);
	},
);
