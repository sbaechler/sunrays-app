/**
 * Standort-Quick-Check (Story 6.2, FR15): übernimmt die Geräteposition als
 * Marker — nur auf explizite Nutzeraktion (NFR8). Bei verweigerter
 * Berechtigung bleibt die manuelle Suche der Weg (AC3).
 */
import { LocateFixed } from 'lucide-react';
import { useState } from 'react';

export interface LocateButtonProps {
	onLocate: (pos: { lat: number; lon: number }) => void;
	onError: (message: string) => void;
}

export function LocateButton({ onLocate, onError }: LocateButtonProps) {
	const [busy, setBusy] = useState(false);

	const locate = () => {
		if (!('geolocation' in navigator)) {
			onError('Standortbestimmung wird von diesem Browser nicht unterstützt.');
			return;
		}
		setBusy(true);
		navigator.geolocation.getCurrentPosition(
			pos => {
				setBusy(false);
				onLocate({ lat: pos.coords.latitude, lon: pos.coords.longitude });
			},
			err => {
				setBusy(false);
				onError(
					err.code === err.PERMISSION_DENIED
						? 'Standortzugriff verweigert – nutze die Ortssuche.'
						: 'Standort konnte nicht bestimmt werden – nutze die Ortssuche.',
				);
			},
			{ enableHighAccuracy: true, timeout: 10_000 },
		);
	};

	return (
		<button
			type="button"
			onClick={locate}
			disabled={busy}
			aria-label="Aktuelle Position übernehmen"
			className="inline-flex size-10 items-center justify-center rounded-panel border border-border bg-card text-card-foreground shadow-sm transition-colors hover:bg-muted disabled:opacity-60"
		>
			<LocateFixed className={'size-5' + (busy ? ' animate-pulse' : '')} aria-hidden />
		</button>
	);
}
