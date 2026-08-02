/**
 * Gemeinsame Bausteine der Rechtsseite. Die Prosa selbst liegt bewusst in
 * locale-spezifischen Komponenten (RechtlichesDe/RechtlichesEn) statt in
 * Lingui-Katalogen: Rechtstexte sind pro Sprache eigenständige Fassungen.
 */
import type { ReactNode } from 'react';

export const STAND = '2. August 2026';
export const STAND_EN = 'August 2, 2026';

export const CONTACT_EMAIL = 'laecheln.origami6t@icloud.com';

export function Section({
	id,
	title,
	children,
}: {
	id: string;
	title: string;
	children: ReactNode;
}) {
	return (
		<section id={id} className="scroll-mt-24 space-y-3">
			<h2 className="text-xl font-semibold text-foreground">{title}</h2>
			{children}
		</section>
	);
}

export function SubHeading({ children }: { children: ReactNode }) {
	return <h3 className="pt-2 text-base font-semibold text-foreground">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
	return <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

export function List({ children }: { children: ReactNode }) {
	return (
		<ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
			{children}
		</ul>
	);
}

export function Ext({ href, children }: { href: string; children: ReactNode }) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noreferrer noopener"
			className="underline decoration-border underline-offset-2 transition-colors hover:text-foreground"
		>
			{children}
		</a>
	);
}
