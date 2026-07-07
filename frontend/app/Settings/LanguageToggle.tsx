import { localeAtom, t } from '#/Settings/i18n';
import { useAtom } from 'jotai';

/** DE/EN-Umschalter (FR16): manueller Override der Browser-Sprache. */
export function LanguageToggle() {
	const [locale, setLocale] = useAtom(localeAtom);
	return (
		<button
			type="button"
			onClick={() => setLocale(locale === 'de' ? 'en' : 'de')}
			aria-label={t(locale, 'langSwitch')}
			className="inline-flex size-10 items-center justify-center rounded-panel border border-border bg-card text-sm font-semibold uppercase text-card-foreground shadow-sm transition-colors hover:bg-muted"
		>
			{locale === 'de' ? 'EN' : 'DE'}
		</button>
	);
}
