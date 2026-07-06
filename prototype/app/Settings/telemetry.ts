/**
 * Cookie-freie Telemetrie (Story 6.4, FR18/NFR8): Umami für Custom Events,
 * nur aktiv wenn per ENV konfiguriert (VITE_UMAMI_WEBSITE_ID, optional
 * VITE_UMAMI_SRC). Cloudflare Web Analytics wird im Pages-Dashboard aktiviert
 * (siehe docs/deployment.md). Keine Cookies, keine personenbezogenen Daten.
 */

type UmamiGlobal = { track: (event: string, data?: Record<string, unknown>) => void };

export type TelemetryEvent =
	| 'simulation'
	| 'export_png'
	| 'export_svg'
	| 'share_link'
	| 'quota_degradation'
	| 'missing_3d_data';

export function initTelemetry(): void {
	const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID as string | undefined;
	if (!websiteId || document.querySelector('script[data-website-id]')) return;
	const src =
		(import.meta.env.VITE_UMAMI_SRC as string | undefined) ?? 'https://cloud.umami.is/script.js';
	const script = document.createElement('script');
	script.src = src;
	script.defer = true;
	script.setAttribute('data-website-id', websiteId);
	document.head.appendChild(script);
}

export function trackEvent(event: TelemetryEvent, data?: Record<string, unknown>): void {
	const umami = (window as unknown as { umami?: UmamiGlobal }).umami;
	umami?.track(event, data);
}
