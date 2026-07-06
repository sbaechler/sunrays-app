/**
 * Theme-Verwaltung (Story 1.3, FR17): Dark/Light umschaltbar,
 * Default folgt der System-Präferenz.
 */
export type ThemePreference = 'light' | 'dark' | 'system';

export const THEME_STORAGE_KEY = 'sunrays-theme';

/**
 * Wird als Inline-Script im <head> ausgeführt, bevor gerendert wird
 * (verhindert Theme-Flackern beim Laden).
 */
export const themeInitScript = `(function () {
  try {
    var pref = localStorage.getItem('${THEME_STORAGE_KEY}');
    var dark = pref === 'dark' || (pref !== 'light' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', dark);
  } catch (e) {}
})();`;

export function getThemePreference(): ThemePreference {
	if (typeof localStorage === 'undefined') return 'system';
	const stored = localStorage.getItem(THEME_STORAGE_KEY);
	return stored === 'light' || stored === 'dark' ? stored : 'system';
}

export function applyThemePreference(pref: ThemePreference): void {
	if (pref === 'system') {
		localStorage.removeItem(THEME_STORAGE_KEY);
	} else {
		localStorage.setItem(THEME_STORAGE_KEY, pref);
	}
	const dark =
		pref === 'dark' ||
		(pref === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
	document.documentElement.classList.toggle('dark', dark);
}
