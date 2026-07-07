import { initTelemetry } from '#/Settings/telemetry';
import { themeInitScript } from '#/Settings/theme';
import styles from '#/styles/tailwind.css?url';
import { useEffect, type ReactNode } from 'react';
import {
	isRouteErrorResponse,
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useRouteError,
} from 'react-router';

export function links() {
	return [
		{ rel: 'stylesheet', href: styles },
		{ rel: 'manifest', href: '/manifest.webmanifest' },
		{ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
		{ rel: 'icon', href: '/icon-192.png', type: 'image/png' },
	];
}

const APP_DESCRIPTION =
	'Sonnenverlauf für Ort und Datum – Planungstool für DoPs und Fotograf:innen';

export function Document({ children }: { children?: ReactNode }) {
	return (
		// suppressHydrationWarning: das Theme-Init-Script setzt die dark-Klasse vor der Hydration
		<html lang="de" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="theme-color" content="#0e1c2a" />
				{/* SEO / Social Cards */}
				<meta name="description" content={APP_DESCRIPTION} />
				<meta property="og:title" content="Sunrays" />
				<meta property="og:description" content={APP_DESCRIPTION} />
				<meta property="og:type" content="website" />
				<meta property="og:image" content="/icon-512.png" />
				<meta name="twitter:card" content="summary" />
				<script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
				<Meta />
				<Links />
			</head>
			<body className="min-h-screen bg-background font-sans text-foreground">
				{children}
				<Scripts />
			</body>
		</html>
	);
}

export default function App() {
	useEffect(() => {
		initTelemetry();
	}, []);
	return (
		<Document>
			<Outlet />
			<ScrollRestoration />
		</Document>
	);
}

export function HydrateFallback() {
	return (
		<Document>
			<div className="flex min-h-screen items-center justify-center">
				<p className="text-muted-foreground">Sunrays lädt …</p>
			</div>
		</Document>
	);
}

/**
 * Fallback-UI für unbehandelte Fehler (Robustheit): statt eines weissen
 * Bildschirms eine kurze Meldung mit Reload-Möglichkeit. Details landen in
 * der Konsole; bewusst zweisprachig, da die i18n-Atoms hier nicht verfügbar
 * sein müssen.
 */
export function ErrorBoundary() {
	const error = useRouteError();
	const status = isRouteErrorResponse(error) ? error.status : null;
	useEffect(() => {
		console.error('Sunrays ErrorBoundary:', error);
	}, [error]);
	return (
		<Document>
			<main className="flex min-h-screen items-center justify-center p-6">
				<div className="max-w-md rounded-panel border border-border bg-card p-6 text-center shadow-sm">
					<h1 className="text-lg font-semibold text-card-foreground">
						{status === 404
							? 'Seite nicht gefunden / Page not found'
							: 'Etwas ist schiefgelaufen / Something went wrong'}
					</h1>
					<p className="mt-2 text-sm text-muted-foreground">
						{status === 404
							? 'Diese Adresse existiert nicht. / This address does not exist.'
							: 'Bitte lade die Seite neu. / Please reload the page.'}
					</p>
					<a
						href="/"
						className="mt-4 inline-block rounded-panel bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
					>
						Zur Startseite / Back to start
					</a>
				</div>
			</main>
		</Document>
	);
}
