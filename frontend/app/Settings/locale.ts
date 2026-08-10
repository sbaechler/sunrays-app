/**
 * Locale-Verwaltung (FR16): automatische Wahl per Browser-Sprache
 * (navigator.language spiegelt den Accept-Language-Header), manueller
 * Override persistiert in localStorage. Übersetzungen via Lingui; die
 * .po-Kataloge werden vom Vite-Plugin build-seitig kompiliert (CSP-safe)
 * und pro Sprache als eigener Chunk lazy geladen.
 *
 * Wichtig: Der Source-Katalog (de) wird eager geladen. Production-Macros
 * kompilieren zu Hash-IDs ohne Message-Fallback — ein leerer Katalog
 * (früher `i18n.load('de', {})`) erzeugt sonst "Uncompiled message
 * detected! Message: AmG8eO" und zeigt Hashes in der UI.
 */
import { i18n } from '@lingui/core';
import type { Messages } from '@lingui/core';
import { atom } from 'jotai';
import { messages as deMessages } from '../locales/de/messages.po';

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

/** Cache: de ist immer vorhanden; andere Locales nach erstem Laden. */
const catalogCache = new Map<Locale, Messages>([['de', deMessages]]);

// Source-Locale sofort aktiv — SSR-Prerender und erster Client-Paint
// haben gültige Übersetzungen (nie leerer Katalog / nie Hash-Fallbacks).
i18n.load('de', deMessages);
i18n.activate('de');

async function loadCatalog(locale: Locale): Promise<Messages> {
	const cached = catalogCache.get(locale);
	if (cached) return cached;
	// Vite bündelt jede Sprache als eigenen Chunk und lädt nur die aktive
	const { messages } = await import(`../locales/${locale}/messages.po`);
	catalogCache.set(locale, messages);
	return messages;
}

async function activateLocale(locale: Locale): Promise<void> {
	const messages = await loadCatalog(locale);
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
	void activateLocale(locale).then(() => {
		document.documentElement.lang = locale;
		set(locale);
	});
};

export const localeAtom = atom(
	get => get(baseLocaleAtom),
	(_get, set, locale: Locale) => {
		localStorage.setItem(STORAGE_KEY, locale);
		document.documentElement.lang = locale;
		set(baseLocaleAtom, locale);
		void activateLocale(locale);
	},
);
