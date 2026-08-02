import { LOCALE_LABELS, LOCALES, localeAtom } from '#/Settings/locale';
import { useLingui } from '@lingui/react/macro';
import { useAtom } from 'jotai';
import { Languages } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

/**
 * Sprachwahl (FR16): Dropdown mit allen verfügbaren Sprachen — manueller
 * Override der Browser-Sprache. ARIA-Listbox mit Tastaturnavigation.
 */
export function LanguageToggle() {
	const { t } = useLingui();
	const [locale, setLocale] = useAtom(localeAtom);
	const [open, setOpen] = useState(false);
	const containerRef = useRef<HTMLDivElement>(null);

	// Klick ausserhalb schliesst die Liste
	useEffect(() => {
		if (!open) return;
		const onPointerDown = (e: PointerEvent) => {
			if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	}, [open]);

	const select = (next: (typeof LOCALES)[number]) => {
		setLocale(next);
		setOpen(false);
	};

	return (
		<div ref={containerRef} className="relative">
			<button
				type="button"
				onClick={() => setOpen(o => !o)}
				onKeyDown={e => e.key === 'Escape' && setOpen(false)}
				aria-label={t`Sprache wechseln`}
				aria-haspopup="listbox"
				aria-expanded={open}
				className="inline-flex size-10 items-center justify-center rounded-panel border border-border bg-card text-card-foreground shadow-sm transition-colors hover:bg-muted"
			>
				<Languages className="size-5" aria-hidden />
			</button>
			{open && (
				<ul
					role="listbox"
					aria-label={t`Sprache wählen`}
					onKeyDown={e => e.key === 'Escape' && setOpen(false)}
					className="absolute right-0 top-full z-20 mt-1 min-w-32 overflow-hidden rounded-panel border border-border bg-card shadow-lg"
				>
					{LOCALES.map(l => (
						<li key={l} role="presentation">
							<button
								type="button"
								role="option"
								aria-selected={l === locale}
								onClick={() => select(l)}
								className={
									'block w-full px-4 py-2 text-left text-sm text-card-foreground hover:bg-muted ' +
									(l === locale ? 'font-semibold' : '')
								}
							>
								{LOCALE_LABELS[l]}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
