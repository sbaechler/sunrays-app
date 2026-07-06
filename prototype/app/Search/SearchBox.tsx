/**
 * Ortssuche mit Autocomplete (Story 3.2, FR1).
 * ARIA-Combobox mit Tastaturnavigation, Debounce und Abbruch veralteter
 * Requests; klare Leer-/Fehlerzustände (AC3).
 */
import { getGeocodingProvider, type GeocodingResult } from '#/Search/geocoding';
import { localeAtom, t } from '#/Settings/i18n';
import { useAtomValue } from 'jotai';
import { useEffect, useRef, useState } from 'react';

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

export interface SearchBoxProps {
	onSelect: (result: GeocodingResult) => void;
}

type SearchStatus = 'idle' | 'loading' | 'results' | 'empty' | 'error';

export function SearchBox({ onSelect }: SearchBoxProps) {
	const locale = useAtomValue(localeAtom);
	const [query, setQuery] = useState('');
	const [status, setStatus] = useState<SearchStatus>('idle');
	const [results, setResults] = useState<GeocodingResult[]>([]);
	const [activeIndex, setActiveIndex] = useState(-1);
	const [open, setOpen] = useState(false);
	const abortRef = useRef<AbortController | null>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (query.trim().length < MIN_QUERY_LENGTH) {
			setStatus('idle');
			setResults([]);
			setOpen(false);
			return;
		}
		const timer = setTimeout(() => {
			abortRef.current?.abort();
			const controller = new AbortController();
			abortRef.current = controller;
			setStatus('loading');
			getGeocodingProvider()
				.search(query.trim(), controller.signal)
				.then(r => {
					setResults(r);
					setActiveIndex(-1);
					setStatus(r.length ? 'results' : 'empty');
					setOpen(true);
				})
				.catch((err: unknown) => {
					if (err instanceof DOMException && err.name === 'AbortError') return;
					setResults([]);
					setStatus('error');
					setOpen(true);
				});
		}, DEBOUNCE_MS);
		return () => clearTimeout(timer);
	}, [query]);

	// Klick ausserhalb schliesst die Liste
	useEffect(() => {
		const onPointerDown = (e: PointerEvent) => {
			if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
		};
		document.addEventListener('pointerdown', onPointerDown);
		return () => document.removeEventListener('pointerdown', onPointerDown);
	}, []);

	const select = (result: GeocodingResult) => {
		setQuery(result.label);
		setOpen(false);
		onSelect(result);
	};

	const onKeyDown = (e: React.KeyboardEvent) => {
		if (!open || status !== 'results') {
			if (e.key === 'Escape') setOpen(false);
			return;
		}
		if (e.key === 'ArrowDown') {
			e.preventDefault();
			setActiveIndex(i => (i + 1) % results.length);
		} else if (e.key === 'ArrowUp') {
			e.preventDefault();
			setActiveIndex(i => (i <= 0 ? results.length - 1 : i - 1));
		} else if (e.key === 'Enter' && activeIndex >= 0) {
			e.preventDefault();
			const r = results[activeIndex];
			if (r) select(r);
		} else if (e.key === 'Escape') {
			setOpen(false);
		}
	};

	return (
		<div ref={containerRef} className="relative">
			<label htmlFor="location-search" className="sr-only">
				{t(locale, 'searchLabel')}
			</label>
			<input
				id="location-search"
				type="search"
				role="combobox"
				aria-expanded={open}
				aria-controls="location-search-results"
				aria-activedescendant={activeIndex >= 0 ? `location-option-${activeIndex}` : undefined}
				aria-autocomplete="list"
				autoComplete="off"
				value={query}
				onChange={e => setQuery(e.target.value)}
				onKeyDown={onKeyDown}
				onFocus={() => results.length > 0 && setOpen(true)}
				placeholder={t(locale, 'searchPlaceholder')}
				className="w-full rounded-panel border border-border bg-card px-4 py-2.5 text-card-foreground shadow-sm placeholder:text-muted-foreground"
			/>
			{open && (
				<ul
					id="location-search-results"
					role="listbox"
					aria-label={t(locale, 'searchResults')}
					className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-panel border border-border bg-card shadow-lg"
				>
					{status === 'results' &&
						results.map((r, i) => (
							<li key={`${r.lat}-${r.lon}-${i}`} role="presentation">
								<button
									type="button"
									id={`location-option-${i}`}
									role="option"
									aria-selected={i === activeIndex}
									onClick={() => select(r)}
									onMouseEnter={() => setActiveIndex(i)}
									className={
										'block w-full px-4 py-2 text-left text-sm text-card-foreground ' +
										(i === activeIndex ? 'bg-muted' : '')
									}
								>
									{r.label}
								</button>
							</li>
						))}
					{status === 'empty' && (
						<li className="px-4 py-2 text-sm text-muted-foreground">
							{t(locale, 'searchNoResults')}
						</li>
					)}
					{status === 'error' && (
						<li className="px-4 py-2 text-sm text-error">{t(locale, 'searchError')}</li>
					)}
					{status === 'loading' && (
						<li className="px-4 py-2 text-sm text-muted-foreground">
							{t(locale, 'searchLoading')}
						</li>
					)}
				</ul>
			)}
		</div>
	);
}
