/**
 * Export & Sharing (Epic 5): PNG- und SVG-Export sowie Share-Link (FR11–FR13).
 * Aktiv, sobald ein Marker gesetzt und der Sonnenverlauf berechnet ist.
 */
import type maplibregl from 'maplibre-gl';
import { Check, Download, Link as LinkIcon } from 'lucide-react';
import { useState } from 'react';
import type { MarkerPosition } from '#/Map/state';
import type { SunStateResult } from '#/Sun/state';
import { downloadBlob, exportFilename } from '#/Sharing/exportShared';
import { buildPngBlob } from '#/Sharing/exportPng';
import { buildFanSvg } from '#/Sharing/exportSvg';

export interface ShareControlsProps {
  map: maplibregl.Map | null;
  marker: MarkerPosition | null;
  sun: SunStateResult;
}

export function ShareControls({ map, marker, sun }: ShareControlsProps) {
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const ready = sun.status === 'ready' && marker !== null;

  const exportPng = async () => {
    if (!ready || !map || sun.status !== 'ready') return;
    setBusy(true);
    try {
      const blob = await buildPngBlob({
        map,
        marker: marker,
        path: sun.path,
        date: sun.date,
        timeZone: sun.timeZone,
      });
      downloadBlob(blob, exportFilename('png', sun.date, marker.lat, marker.lon));
    } finally {
      setBusy(false);
    }
  };

  const exportSvg = () => {
    if (!ready || sun.status !== 'ready') return;
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
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
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
        aria-label="Aktuelle Ansicht als PNG exportieren"
      >
        <Download className="size-4" aria-hidden /> PNG
      </button>
      <button
        type="button"
        onClick={exportSvg}
        disabled={!ready}
        className={buttonClass + ' border-l border-border'}
        aria-label="Fächer als SVG exportieren"
      >
        <Download className="size-4" aria-hidden /> SVG
      </button>
      <button
        type="button"
        onClick={() => void copyLink()}
        disabled={marker === null}
        className={buttonClass + ' border-l border-border'}
        aria-label="Link zu dieser Ansicht kopieren"
      >
        {copied ? (
          <Check className="size-4 text-success" aria-hidden />
        ) : (
          <LinkIcon className="size-4" aria-hidden />
        )}
        {copied ? 'Kopiert' : 'Link'}
      </button>
    </div>
  );
}
