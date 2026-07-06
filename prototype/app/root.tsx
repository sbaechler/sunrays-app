import styles from '#/styles/tailwind.css?url';
import type { ReactNode } from 'react';
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import { themeInitScript } from '#/Settings/theme';

export function links() {
  return [{ rel: 'stylesheet', href: styles }];
}

export function Document({ children }: { children?: ReactNode }) {
  return (
    // suppressHydrationWarning: das Theme-Init-Script setzt die dark-Klasse vor der Hydration
    <html lang="de" suppressHydrationWarning>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="robots" content="noindex nofollow" />
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
