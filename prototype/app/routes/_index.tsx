import type { MetaFunction } from 'react-router';
import { useState } from 'react';
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
 * App-Shell (Story 1.3): Map-first-Layout — die Karte füllt den Viewport,
 * alle Controls liegen als ruhige Panels darüber ("UI als Support-Layer").
 * Die Platzhalter werden in Epic 3/4 durch Karte, Suche, Datum und
 * 2D/3D-Ansichten ersetzt.
 */
export default function Index() {
  const [viewMode, setViewMode] = useState<'2d' | '3d'>('2d');

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* Karten-Fläche (Platzhalter bis Story 3.1) */}
      <div
        aria-label="Kartenansicht (Platzhalter)"
        className="absolute inset-0 flex items-center justify-center bg-muted"
      >
        <div className="max-w-sm px-6 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground">Sunrays</p>
          <p className="mt-3 text-muted-foreground">
            Hier erscheint die Karte (Story 3.1). Pin setzen → Fächer sehen.
          </p>
        </div>
      </div>

      {/* Suche (Platzhalter bis Story 3.2) */}
      <div className="absolute left-4 top-4 w-[min(22rem,calc(100%-7rem))]">
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
      <div className="absolute right-4 top-4 flex items-center gap-2">
        <div
          role="group"
          aria-label="Ansicht wählen"
          className="flex overflow-hidden rounded-panel border border-border bg-card shadow-sm"
        >
          {(['2d', '3d'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setViewMode(mode)}
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
      <div className="absolute bottom-4 left-1/2 w-[min(20rem,calc(100%-2rem))] -translate-x-1/2">
        <div className="flex items-center justify-between rounded-panel border border-border bg-card px-4 py-2.5 text-card-foreground shadow-sm">
          <span className="text-sm text-muted-foreground">Datum</span>
          <span className="text-sm font-medium">folgt in Story 3.3</span>
        </div>
      </div>
    </div>
  );
}
