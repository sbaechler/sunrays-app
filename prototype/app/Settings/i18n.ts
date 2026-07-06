/**
 * Leichtgewichtige i18n (Story 6.3, FR16): DE/EN-Dictionaries, automatische
 * Wahl per Browser-Sprache, manueller Override persistiert in localStorage.
 */
import { atom } from 'jotai';

export type Locale = 'de' | 'en';

const STORAGE_KEY = 'sunrays-locale';

export const MESSAGES = {
	de: {
		appDescription: 'Sonnenverlauf für Ort und Datum – Planungstool für DoPs und Fotograf:innen',
		loading: 'Sunrays lädt …',
		clickToPlaceMarker: 'Klicke auf die Karte, um das Motiv zu markieren',
		searchPlaceholder: 'Ort suchen …',
		searchLabel: 'Ort suchen',
		searchResults: 'Suchergebnisse',
		searchNoResults: 'Keine Treffer',
		searchError: 'Suche derzeit nicht erreichbar – bitte später erneut versuchen',
		searchLoading: 'Suche …',
		viewChoose: 'Ansicht wählen',
		themeToLight: 'Zu hellem Design wechseln',
		themeToDark: 'Zu dunklem Design wechseln',
		langSwitch: 'Sprache wechseln (Deutsch/Englisch)',
		locateLabel: 'Aktuelle Position übernehmen',
		locateUnsupported: 'Standortbestimmung wird von diesem Browser nicht unterstützt.',
		locateDenied: 'Standortzugriff verweigert – nutze die Ortssuche.',
		locateFailed: 'Standort konnte nicht bestimmt werden – nutze die Ortssuche.',
		dateLabel: 'Datum',
		prevDay: 'Vorheriger Tag',
		nextDay: 'Nächster Tag',
		seasonLabel: 'Jahreszeit wählen',
		seasonPlaceholder: 'Jahreszeit …',
		seasonSpring: 'Frühling (20.3.)',
		seasonSummer: 'Sommer (21.6.)',
		seasonAutumn: 'Herbst (23.9.)',
		seasonWinter: 'Winter (21.12.)',
		sunrise: 'Aufgang',
		sunset: 'Untergang',
		culmination: 'Kulmination',
		exportPngLabel: 'Aktuelle Ansicht als PNG exportieren',
		exportSvgLabel: 'Fächer als SVG exportieren',
		copyLinkLabel: 'Link zu dieser Ansicht kopieren',
		copied: 'Kopiert',
		link: 'Link',
		outOfRange: 'Berechnung derzeit nur bis ±65° Breite möglich.',
		mapAria: 'Kartenansicht',
		markerAria: 'Motiv-Standort',
	},
	en: {
		appDescription: 'Sun path for any location and date – planning tool for DoPs and photographers',
		loading: 'Loading Sunrays …',
		clickToPlaceMarker: 'Click the map to mark your subject',
		searchPlaceholder: 'Search location …',
		searchLabel: 'Search location',
		searchResults: 'Search results',
		searchNoResults: 'No results',
		searchError: 'Search currently unavailable – please try again later',
		searchLoading: 'Searching …',
		viewChoose: 'Choose view',
		themeToLight: 'Switch to light theme',
		themeToDark: 'Switch to dark theme',
		langSwitch: 'Switch language (German/English)',
		locateLabel: 'Use current position',
		locateUnsupported: 'Geolocation is not supported by this browser.',
		locateDenied: 'Location access denied – use the search instead.',
		locateFailed: 'Could not determine your position – use the search instead.',
		dateLabel: 'Date',
		prevDay: 'Previous day',
		nextDay: 'Next day',
		seasonLabel: 'Choose season',
		seasonPlaceholder: 'Season …',
		seasonSpring: 'Spring (Mar 20)',
		seasonSummer: 'Summer (Jun 21)',
		seasonAutumn: 'Autumn (Sep 23)',
		seasonWinter: 'Winter (Dec 21)',
		sunrise: 'Sunrise',
		sunset: 'Sunset',
		culmination: 'Culmination',
		exportPngLabel: 'Export current view as PNG',
		exportSvgLabel: 'Export fan as SVG',
		copyLinkLabel: 'Copy link to this view',
		copied: 'Copied',
		link: 'Link',
		outOfRange: 'Calculation currently limited to ±65° latitude.',
		mapAria: 'Map view',
		markerAria: 'Subject location',
	},
} as const;

export type MessageKey = keyof (typeof MESSAGES)['de'];

export function detectLocale(): Locale {
	if (typeof window === 'undefined') return 'de';
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === 'de' || stored === 'en') return stored;
	return navigator.language.toLowerCase().startsWith('de') ? 'de' : 'en';
}

const baseLocaleAtom = atom<Locale>('de');
baseLocaleAtom.onMount = set => {
	set(detectLocale());
};

export const localeAtom = atom(
	get => get(baseLocaleAtom),
	(_get, set, locale: Locale) => {
		localStorage.setItem(STORAGE_KEY, locale);
		document.documentElement.lang = locale;
		set(baseLocaleAtom, locale);
	},
);

export function t(locale: Locale, key: MessageKey): string {
	return MESSAGES[locale][key];
}
