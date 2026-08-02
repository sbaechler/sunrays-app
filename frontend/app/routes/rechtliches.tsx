import { localeAtom } from '#/Settings/locale';
import { useAtomValue } from 'jotai';
import { lazy, Suspense } from 'react';
import type { MetaFunction } from 'react-router';

export const meta: MetaFunction = () => [
	{ title: 'Rechtliches – Sunrays' },
	{ name: 'description', content: 'Datenschutzerklärung und Nutzungsbedingungen von Sunrays' },
	{ name: 'robots', content: 'noindex' },
];

// DE und EN als eigene Lazy-Chunks — die Rechtsprosa bleibt aus dem
// Initial-Bundle und aus den Lingui-Katalogen (siehe rechtliches/shared.tsx)
const RechtlichesDe = lazy(() => import('./rechtliches/RechtlichesDe'));
const RechtlichesEn = lazy(() => import('./rechtliches/RechtlichesEn'));

/**
 * Rechtliche Hinweise (Datenschutzerklärung + Nutzungsbedingungen) als eigene
 * Route statt als Link auf GitHub: die Texte müssen ohne Umweg über einen
 * US-Dienst erreichbar sein. Die Seite wird beim Build vorgerendert und lädt
 * weder Karte noch Cesium.
 */
export default function Rechtliches() {
	const locale = useAtomValue(localeAtom);
	return (
		<Suspense fallback={null}>
			{locale === 'de' ? <RechtlichesDe /> : <RechtlichesEn />}
		</Suspense>
	);
}
