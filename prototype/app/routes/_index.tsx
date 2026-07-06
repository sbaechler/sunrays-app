import type { MetaFunction } from 'react-router';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { MapView } from '#/Map/MapView';
import { markerAtom, viewModeAtom } from '#/Map/state';
import { readUrlState, writeUrlState } from '#/Map/urlState';
import { ThemeToggle } from '#/Settings/ThemeToggle';

export const meta: MetaFunction = () => {
  return [
    { title: 'Sunrays' },
    {
      name: 'description',
      content: 'Sonnenverlauf für Ort und Datum – Planungstool für DoPs und Fotograf:innen',
    },
  ];
};

/**
 * App-Shell (Story 1.3/3.1): Map-first-Layout — die Karte füllt den Viewport,
 * alle Controls liegen als ruhige Panels darüber ("UI als Support-Layer").
 */
export default function Index() {
  const [marker, setMarker] = useAtom(markerAtom);
  const [viewMode, setViewMode] = useAtom(viewModeAtom);
  const [hydratedFromUrl, setHydratedFromUrl] = useState(false);
  const zoomRef = useRef<number | null>(null);

  // Initialen Zustand aus der URL übernehmen (Vorarbeit FR13)
  useEffect(() => {
    const url = readUrlState(window.location.search);
    if (url.marker) setMarker(url.marker);
    if (url.view) setViewMode(url.view);
    zoomRef.current = url.zoom;
    setHydratedFromUrl(true);
  }, []);

  const handleMarkerChange = useCallback(
    (pos: { lat: number; lon: number }) => {
      setMarker(pos);
      writeUrlState({ marker: pos });
    },
    [setMarker],
  );

  const handleZoomChange = useCallback((zoom: number) => {
    writeUrlState({ zoom });
  }, []);

  const handleViewChange = (mode: '2d' | '3d') => {
    setViewMode(mode);
    writeUrlState({ marker, view: mode });
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* Karte (Story 3.1) — erst mounten, wenn der URL-State gelesen ist */}
      {hydratedFromUrl ? (
        <MapView
          marker={marker}
          initialZoom={zoomRef.current}
          onMarkerChange={handleMarkerChange}
          onZoomChange={handleZoomChange}
        />
      ) : null}

      {/* Hinweis, solange kein Pin gesetzt ist */}
      {marker === null && (
        <div className="pointer-events-none absolute inset-x-0 top-20 z-10 flex justify-center">
          <p className="rounded-panel border border-border bg-card/90 px-4 py-2 text-sm text-card-foreground shadow-sm backdrop-blur">
            Klicke auf die Karte, um das Motiv zu markieren
          </p>
        </div>
      )}

      {/* Suche (Platzhalter bis Story 3.2) */}
      <div className="absolute left-4 top-4 z-10 w-[min(22rem,calc(100%-7rem))]">
        <label htmlFor="location-search" className="sr-only">
          Ort suchen
        </label>
        <input
          id="location-search"
          type="search"
          disabled
          placeholder="Ort suchen … (folgt in Story 3.2)"
          className="w-full rounded-panel border border-border bg-card px-4 py-2.5 text-card-foreground shadow-sm placeholder:text-muted-foreground disabled:opacity-70"
        />
      </div>

      {/* Ansicht & Theme */}
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <div
          role="group"
          aria-label="Ansicht wählen"
          className="flex overflow-hidden rounded-panel border border-border bg-card shadow-sm"
        >
          {(['2d', '3d'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => handleViewChange(mode)}
              aria-pressed={viewMode === mode}
              className={
                'px-4 py-2 text-sm font-medium transition-colors ' +
                (viewMode === mode
                  ? 'bg-primary text-primary-foreground'
                  : 'text-card-foreground hover:bg-muted')
              }
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
        <ThemeToggle />
      </div>

      {/* Datum (Platzhalter bis Story 3.3) */}
      <div className="absolute bottom-4 left-1/2 z-10 w-[min(20rem,calc(100%-2rem))] -translate-x-1/2">
        <div className="flex items-center justify-between rounded-panel border border-border bg-card px-4 py-2.5 text-card-foreground shadow-sm">
          <span className="text-sm text-muted-foreground">Datum</span>
          <span className="text-sm font-medium">folgt in Story 3.3</span>
        </div>
      </div>
    </div>
  );
}
