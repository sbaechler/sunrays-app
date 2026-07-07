import { localeAtom, t } from '#/Settings/i18n';
import { applyThemePreference, getThemePreference } from '#/Settings/theme';
import { useAtomValue } from 'jotai';
import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';

/** Umschalter Dark/Light (FR17). Zeigt den Zustand nach Hydration an. */
export function ThemeToggle() {
	const locale = useAtomValue(localeAtom);
	const [isDark, setIsDark] = useState<boolean | null>(null);

	useEffect(() => {
		setIsDark(document.documentElement.classList.contains('dark'));
	}, []);

	const toggle = () => {
		const next = document.documentElement.classList.contains('dark') ? 'light' : 'dark';
		applyThemePreference(next);
		setIsDark(next === 'dark');
		// Doppelklick auf die System-Präferenz setzt zurück auf "system"
		if (
			(next === 'dark') === window.matchMedia('(prefers-color-scheme: dark)').matches &&
			getThemePreference() !== 'system'
		) {
			applyThemePreference('system');
		}
	};

	return (
		<button
			type="button"
			onClick={toggle}
			aria-label={isDark ? t(locale, 'themeToLight') : t(locale, 'themeToDark')}
			className="inline-flex size-10 items-center justify-center rounded-panel border border-border bg-card text-card-foreground shadow-sm transition-colors hover:bg-muted"
		>
			{isDark === null ? (
				<span className="size-5" aria-hidden />
			) : isDark ? (
				<Sun className="size-5" aria-hidden />
			) : (
				<Moon className="size-5" aria-hidden />
			)}
		</button>
	);
}
