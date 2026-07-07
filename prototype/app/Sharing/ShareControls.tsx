/**
 * Export & Sharing (Epic 5): PNG- und SVG-Export sowie Share-Link (FR11–FR13).
 * Aktiv, sobald ein Marker gesetzt und der Sonnenverlauf berechnet ist.
 * PNG exportiert die jeweils aktive Ansicht (2D-Karte oder 3D-Szene).
 */
import type { MarkerPosition } from '#/Map/state';
import { localeAtom, t } from '#/Settings/i18n';
import { trackEvent } from '#/Settings/telemetry';
import { buildPngBlob } from '#/Sharing/exportPng';
import { buildPng3dBlob } from '#/Sharing/exportPng3d';
import {
	downloadBlob,
	exportFilename,
	SCENE3D_ATTRIBUTION,
	SCENE3D_FALLBACK_ATTRIBUTION,
} from '#/Sharing/exportShared';
import { buildFanSvg } from '#/Sharing/exportSvg';
import type { SunStateResult } from '#/Sun/state';
import type { Viewer } from 'cesium';
import { useAtomValue } from 'jotai';
import { Check, Download, Link as LinkIcon } from 'lucide-react';
import type maplibregl from 'maplibre-gl';
import { useState } from 'react';

export interface ShareControlsProps {
	viewMode: '2d' | '3d';
	map: maplibregl.Map | null;
	viewer: Viewer | null;
	/** FR10: bestimmt die Attribution des 3D-Exports (ion vs. Fallback). */
	dataQuality: 'full' | 'degraded' | null;
	marker: MarkerPosition | null;
	sun: SunStateResult;
}

export function ShareControls({
	viewMode,
	map,
	viewer,
	dataQuality,
	marker,
	sun,
}: ShareControlsProps) {
	const locale = useAtomValue(localeAtom);
	const [copied, setCopied] = useState(false);
	const [busy, setBusy] = useState(false);
	const viewReady = viewMode === '2d' ? map !== null : viewer !== null;
	const ready = sun.status === 'ready' && marker !== null && viewReady;

	const exportPng = async () => {
		if (!ready || sun.status !== 'ready' || !marker) return;
		setBusy(true);
		try {
			const common = { marker, path: sun.path, date: sun.date, timeZone: sun.timeZone };
			const blob =
				viewMode === '3d' && viewer
					? await buildPng3dBlob({
							viewer,
							...common,
							attribution:
								dataQuality === 'full' ? SCENE3D_ATTRIBUTION : SCENE3D_FALLBACK_ATTRIBUTION,
						})
					: map
						? await buildPngBlob({ map, ...common })
						: null;
			if (!blob) return;
			downloadBlob(blob, exportFilename('png', sun.date, marker.lat, marker.lon));
			trackEvent('export_png', { view: viewMode });
		} finally {
			setBusy(false);
		}
	};

	const exportSvg = () => {
		if (sun.status !== 'ready' || marker === null) return;
		const svg = buildFanSvg({
			path: sun.path,
			latitude: sun.latitude,
			longitude: sun.longitude,
			date: sun.date,
			timeZone: sun.timeZone,
		});
		downloadBlob(
			new Blob([svg], { type: 'image/svg+xml' }),
			exportFilename('svg', sun.date, sun.latitude, sun.longitude),
		);
		trackEvent('export_svg');
	};

	const copyLink = async () => {
		await navigator.clipboard.writeText(window.location.href);
		trackEvent('share_link');
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const buttonClass =
		'flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:opacity-50';

	return (
		<div className="flex overflow-hidden rounded-panel border border-border bg-card shadow-sm">
			<button
				type="button"
				onClick={() => void exportPng()}
				disabled={!ready || busy}
				className={buttonClass}
				aria-label={t(locale, 'exportPngLabel')}
			>
				<Download className="size-4" aria-hidden /> PNG
			</button>
			<button
				type="button"
				onClick={exportSvg}
				disabled={sun.status !== 'ready' || marker === null}
				className={buttonClass + ' border-l border-border'}
				aria-label={t(locale, 'exportSvgLabel')}
			>
				<Download className="size-4" aria-hidden /> SVG
			</button>
			<button
				type="button"
				onClick={() => void copyLink()}
				disabled={marker === null}
				className={buttonClass + ' border-l border-border'}
				aria-label={t(locale, 'copyLinkLabel')}
			>
				{copied ? (
					<Check className="size-4 text-success" aria-hidden />
				) : (
					<LinkIcon className="size-4" aria-hidden />
				)}
				{copied ? t(locale, 'copied') : t(locale, 'link')}
			</button>
		</div>
	);
}
