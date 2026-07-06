import { initTelemetry } from '#/Settings/telemetry';
import { themeInitScript } from '#/Settings/theme';
import styles from '#/styles/tailwind.css?url';
import { useEffect, type ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

export function links() {
	return [
		{ rel: 'stylesheet', href: styles },
		{ rel: 'manifest', href: '/manifest.webmanifest' },
		{ rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
		{ rel: 'icon', href: '/icon-192.png', type: 'image/png' },
	];
}

export function Document({ children }: { children?: ReactNode }) {
	return (
		// suppressHydrationWarning: das Theme-Init-Script setzt die dark-Klasse vor der Hydration
		<html lang="de" suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<meta name="robots" content="noindex nofollow" />
				<meta name="theme-color" content="#0e1c2a" />
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
