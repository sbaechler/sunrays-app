/**
 * Datumswahl (Story 3.3, FR3): Datums-Picker, ±1-Tag-Navigation und
 * Jahreszeiten-Shortcuts (Solstitien/Äquinoktien) für den Saisonvergleich.
 */
import { ChevronLeft, ChevronRight } from 'lucide-react';

export interface DateControlProps {
  /** ISO-Datum YYYY-MM-DD */
  value: string;
  onChange: (iso: string) => void;
}

function shiftDays(iso: string, delta: number): string {
  const [y = 0, m = 0, d = 0] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d + delta));
  return date.toISOString().slice(0, 10);
}

const SEASON_MARKS = [
  { label: 'Frühling (20.3.)', month: 3, day: 20 },
  { label: 'Sommer (21.6.)', month: 6, day: 21 },
  { label: 'Herbst (23.9.)', month: 9, day: 23 },
  { label: 'Winter (21.12.)', month: 12, day: 21 },
];

export function DateControl({ value, onChange }: DateControlProps) {
  const year = Number(value.slice(0, 4)) || new Date().getFullYear();

  return (
    <div className="flex items-center gap-1 rounded-panel border border-border bg-card px-2 py-1.5 text-card-foreground shadow-sm">
      <button
        type="button"
        aria-label="Vorheriger Tag"
        onClick={() => onChange(shiftDays(value, -1))}
        className="flex size-8 items-center justify-center rounded-md hover:bg-muted"
      >
        <ChevronLeft className="size-4" aria-hidden />
      </button>
      <label htmlFor="sun-date" className="sr-only">
        Datum
      </label>
      <input
        id="sun-date"
        type="date"
        value={value}
        onChange={(e) => e.target.value && onChange(e.target.value)}
        className="rounded-md bg-transparent px-1 py-1 text-sm font-medium [color-scheme:inherit]"
      />
      <button
        type="button"
        aria-label="Nächster Tag"
        onClick={() => onChange(shiftDays(value, 1))}
        className="flex size-8 items-center justify-center rounded-md hover:bg-muted"
      >
        <ChevronRight className="size-4" aria-hidden />
      </button>
      <label htmlFor="season-jump" className="sr-only">
        Jahreszeit wählen
      </label>
      <select
        id="season-jump"
        value=""
        onChange={(e) => {
          const mark = SEASON_MARKS[Number(e.target.value)];
          if (mark) {
            onChange(
              `${year}-${String(mark.month).padStart(2, '0')}-${String(mark.day).padStart(2, '0')}`,
            );
          }
        }}
        className="max-w-28 rounded-md bg-transparent py-1 text-sm text-muted-foreground"
      >
        <option value="" disabled>
          Jahreszeit …
        </option>
        {SEASON_MARKS.map((m, i) => (
          <option key={m.label} value={i}>
            {m.label}
          </option>
        ))}
      </select>
    </div>
  );
}
