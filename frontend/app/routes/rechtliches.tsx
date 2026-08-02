import type { ReactNode } from 'react';
import type { MetaFunction } from 'react-router';

export const meta: MetaFunction = () => [
	{ title: 'Rechtliches – Sunrays' },
	{ name: 'description', content: 'Datenschutzerklärung und Nutzungsbedingungen von Sunrays' },
	{ name: 'robots', content: 'noindex' },
];

const STAND = '2. August 2026';

const CONTACT_EMAIL = 'laecheln.origami6t@icloud.com';

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
	return (
		<section id={id} className="scroll-mt-24 space-y-3">
			<h2 className="text-xl font-semibold text-foreground">{title}</h2>
			{children}
		</section>
	);
}

function SubHeading({ children }: { children: ReactNode }) {
	return <h3 className="pt-2 text-base font-semibold text-foreground">{children}</h3>;
}

function P({ children }: { children: ReactNode }) {
	return <p className="text-sm leading-relaxed text-muted-foreground">{children}</p>;
}

function List({ children }: { children: ReactNode }) {
	return (
		<ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
			{children}
		</ul>
	);
}

function Ext({ href, children }: { href: string; children: ReactNode }) {
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

/**
 * Rechtliche Hinweise (Datenschutzerklärung + Nutzungsbedingungen) als eigene
 * Route statt als Link auf GitHub: die Texte müssen ohne Umweg über einen
 * US-Dienst erreichbar sein. Die Seite wird beim Build vorgerendert und lädt
 * weder Karte noch Cesium.
 */
export default function Rechtliches() {
	return (
		<main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
			<nav className="mb-8">
				<a
					href="/"
					className="text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
				>
					← Zurück zur Karte
				</a>
			</nav>

			<header className="mb-10 space-y-2">
				<h1 className="text-3xl font-semibold tracking-tight text-foreground">Rechtliches</h1>
				<p className="text-sm text-muted-foreground">Stand: {STAND}</p>
				<p className="text-sm text-muted-foreground">
					<a href="#datenschutz" className="underline underline-offset-2">
						Datenschutzerklärung
					</a>
					{' · '}
					<a href="#nutzungsbedingungen" className="underline underline-offset-2">
						Nutzungsbedingungen
					</a>
				</p>
				<p className="text-xs text-muted-foreground">
					This page is available in German only. In short: Sunrays stores no personal data of its
					own, embeds third-party map and geocoding services that receive your IP address and search
					terms, and all calculations are provided without warranty.
				</p>
			</header>

			<div className="space-y-12">
				<article id="datenschutz" className="scroll-mt-24 space-y-8">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Datenschutzerklärung
					</h1>

					<Section id="verantwortlicher" title="1. Verantwortlicher">
						<P>
							Simon Bächler
							<br />
							Zürich, Schweiz
							<br />
							E-Mail: <Ext href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Ext>
						</P>
					</Section>

					<Section id="grundsaetze" title="2. Grundsätze">
						<P>
							Wir nehmen den Schutz deiner persönlichen Daten ernst. Sunrays ist eine rein statische
							Web-Anwendung, die auf Cloudflare gehostet wird. Es gibt kein Benutzerkonto, keine
							Registrierung und keine serverseitige Datenbank.
						</P>
						<P>
							Wir selbst legen{' '}
							<strong className="font-medium text-foreground">keine Nutzerprofile</strong> an und
							speichern keine Inhalte, die du eingibst. Beim Betrieb der App fallen jedoch — wie bei
							jeder Website — technische Daten an, und die App bindet Dienste Dritter ein, die deine
							IP-Adresse und deine Suchanfragen erhalten. Was das genau ist, steht in den
							Abschnitten 3 bis 6.
						</P>
						<P>
							Rechtsgrundlage für die nachfolgend beschriebenen Verarbeitungen ist unser
							berechtigtes Interesse am sicheren, funktionsfähigen und bedarfsgerechten Betrieb der
							App (Art. 6 Abs. 1 lit. f DSGVO bzw. Art. 31 Abs. 1 DSG).
						</P>
					</Section>

					<Section id="hosting" title="3. Hosting und Server-Logs (Cloudflare)">
						<P>
							Die App wird über Cloudflare ausgeliefert (Cloudflare, Inc., USA, mit Rechenzentren
							weltweit). Beim Abruf der Seite verarbeitet Cloudflare technisch notwendige
							Verbindungsdaten wie IP-Adresse, Zeitpunkt, abgerufene Ressource, Referrer und
							User-Agent. Dies ist für die Auslieferung und die Abwehr von Angriffen erforderlich.
						</P>
						<P>
							Cloudflare verarbeitet diese Daten als Auftragsverarbeiter auf Grundlage eines
							Auftragsverarbeitungsvertrags; für Übermittlungen in die USA stützt sich Cloudflare
							auf die EU-Standardvertragsklauseln und das EU-US Data Privacy Framework.
						</P>
					</Section>

					<Section id="analytics" title="4. Reichweitenmessung">
						<SubHeading>Cloudflare Web Analytics</SubHeading>
						<P>
							Wir nutzen Cloudflare Web Analytics, um die Nutzung der Website anonym auszuwerten.
							Der Dienst arbeitet ohne Cookies und ohne Fingerprinting. Erhoben werden nur:
						</P>
						<List>
							<li>gekürzte/anonymisierte IP-Adresse</li>
							<li>Betriebssystem- und Browser-Typ</li>
							<li>ungefähre geografische Region (Land/Region)</li>
							<li>aufgerufene Seiten und Verweildauer</li>
							<li>Referrer (von welcher Seite du kommst)</li>
						</List>
						<P>
							Es werden keine persistenten Cookies gesetzt, keine Cross-Site-Tracking-Mechanismen
							verwendet und keine personenbezogenen Profile erstellt.
						</P>
					</Section>

					<Section id="dritte" title="5. Eingebundene Dienste Dritter">
						<P>
							Damit die App funktioniert, ruft dein Browser Inhalte direkt von den folgenden
							Anbietern ab. Dabei wird deine IP-Adresse an den jeweiligen Anbieter übermittelt —
							technisch unvermeidbar, sonst liesse sich der Inhalt nicht ausliefern. Wir haben
							keinen Einfluss darauf, wie diese Anbieter die Daten weiterverarbeiten; es gelten
							deren Datenschutzerklärungen.
						</P>

						<SubHeading>5.1 Ortssuche / Geokodierung</SubHeading>
						<P>
							Wenn du das Suchfeld benutzt, wird dein eingegebener Suchbegriff zusammen mit deiner
							IP-Adresse an einen Geokodierungsdienst gesendet, um Orte zu finden:
						</P>
						<List>
							<li>
								<strong className="font-medium text-foreground">Photon</strong> (photon.komoot.io),
								Komoot GmbH, Deutschland —{' '}
								<Ext href="https://www.komoot.com/privacy">komoot.com/privacy</Ext>
							</li>
							<li>
								<strong className="font-medium text-foreground">Geoapify Geocoding</strong>{' '}
								(api.geoapify.com), Geoapify GmbH, Deutschland —{' '}
								<Ext href="https://www.geoapify.com/privacy-policy/">
									geoapify.com/privacy-policy
								</Ext>
							</li>
						</List>
						<P>
							Suchbegriffe können Rückschlüsse auf deine Interessen oder geplanten Aufenthaltsorte
							zulassen. Wenn du das vermeiden möchtest, setze den Marker stattdessen direkt per
							Klick auf die Karte — dann findet keine Suchanfrage statt.
						</P>

						<SubHeading>5.2 Kartendaten (2D)</SubHeading>
						<P>
							Die Kartenkacheln stammen von OpenFreeMap (tiles.openfreemap.org), einem freien,
							gemeinnützigen Kartendienst auf Basis von OpenStreetMap-Daten. Übermittelt werden
							IP-Adresse und die angeforderten Kachel-Koordinaten — daraus ergibt sich der von dir
							betrachtete Kartenausschnitt. OpenFreeMap gibt an, keine Logs mit personenbezogenen
							Daten zu führen (<Ext href="https://openfreemap.org/">openfreemap.org</Ext>).
						</P>

						<SubHeading>5.3 3D-Terrain und Gebäude</SubHeading>
						<P>
							In der 3D-Ansicht werden Terrain- und Gebäudedaten von Cesium ion (Cesium GS, Inc.,
							USA) geladen. Übermittelt werden IP-Adresse und die angeforderten Kachel-Koordinaten.
							Es findet damit eine Datenübermittlung in die USA statt. Datenschutzerklärung:{' '}
							<Ext href="https://cesium.com/legal/privacy-policy/">
								cesium.com/legal/privacy-policy
							</Ext>
							.
						</P>
						<P>
							Wenn du das vermeiden möchtest, nutze ausschliesslich die 2D-Ansicht — die 3D-Daten
							werden erst beim Wechsel in die 3D-Ansicht geladen.
						</P>
					</Section>

					<Section id="lokal" title="6. Lokale Speicherung im Browser und Standort">
						<List>
							<li>
								<strong className="font-medium text-foreground">localStorage:</strong> Wir speichern
								deine Sprach- und Design-Einstellung (sunrays-locale, sunrays-theme) lokal in deinem
								Browser. Diese Daten verlassen dein Gerät nicht und werden nicht an uns übertragen.
								Du kannst sie jederzeit über die Browser-Einstellungen löschen.
							</li>
							<li>
								<strong className="font-medium text-foreground">Standortbestimmung:</strong> Wenn du
								die Funktion «Aktuelle Position übernehmen» nutzt, fragt dein Browser dich um
								Erlaubnis und ermittelt die Koordinaten. Diese werden nur lokal zur Anzeige des
								Markers verwendet und nicht an uns oder Dritte gesendet.
							</li>
							<li>
								<strong className="font-medium text-foreground">Teilen-Links:</strong> Beim Teilen
								einer Ansicht werden Ort, Datum und Zoomstufe in die URL geschrieben. Wenn du einen
								solchen Link weitergibst, gibst du damit auch diese Angaben weiter.
							</li>
						</List>
					</Section>

					<Section id="rechte" title="7. Deine Rechte">
						<P>
							Nach DSGVO und DSG stehen dir gegenüber dem Verantwortlichen insbesondere folgende
							Rechte zu: Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
							Datenübertragbarkeit und Widerspruch gegen Verarbeitungen, die auf berechtigtem
							Interesse beruhen.
						</P>
						<P>
							Da wir selbst keine personenbezogenen Daten zu einzelnen Nutzer:innen speichern,
							können wir in der Regel nur eine Negativauskunft erteilen — wir haben schlicht nichts,
							was sich dir zuordnen liesse. Für Daten, die bei den in Abschnitt 5 genannten
							Anbietern anfallen, wende dich bitte direkt an diese.
						</P>
						<P>
							Du hast zudem das Recht, dich bei einer Aufsichtsbehörde zu beschweren — in der
							Schweiz beim Eidgenössischen Datenschutz- und Öffentlichkeitsbeauftragten (EDÖB), in
							der EU bei der Datenschutzbehörde deines Wohnsitzstaates.
						</P>
						<P>
							Für Fragen erreichst du uns unter{' '}
							<Ext href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Ext>.
						</P>
					</Section>

					<Section id="aenderungen-datenschutz" title="8. Änderungen dieser Datenschutzerklärung">
						<P>
							Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie an geänderte
							rechtliche Anforderungen oder Änderungen der App anzupassen. Massgebend ist die
							jeweils auf dieser Seite veröffentlichte Fassung.
						</P>
					</Section>
				</article>

				<hr className="border-border" />

				<article id="nutzungsbedingungen" className="scroll-mt-24 space-y-8">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">
						Nutzungsbedingungen
					</h1>

					<Section id="geltungsbereich" title="1. Geltungsbereich">
						<P>
							Diese Nutzungsbedingungen regeln die Nutzung der Web-App Sunrays (nachfolgend «die
							App»). Mit der Nutzung der App erklärst du dich mit diesen Bedingungen einverstanden.
						</P>
						<P>
							Betreiber: Simon Bächler, Zürich, Schweiz —{' '}
							<Ext href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Ext>
						</P>
					</Section>

					<Section id="leistung" title="2. Leistungsbeschreibung">
						<P>
							Die App berechnet und visualisiert den Sonnenverlauf (Azimut, Elevation, Auf- und
							Untergangszeiten, Dämmerungsphasen) für einen frei wählbaren Ort und Zeitpunkt. Sie
							richtet sich an Fotograf:innen, Kameraleute und andere Personen, die Aufnahmen planen.
						</P>
						<P>
							Die Nutzung ist kostenlos. Es besteht kein Anspruch auf Verfügbarkeit, einen
							bestimmten Funktionsumfang oder den Fortbestand der App. Der Betreiber kann die App
							jederzeit ändern, einschränken oder einstellen.
						</P>
					</Section>

					<Section id="gewaehr" title="3. Keine Gewähr für Berechnungen und Kartendaten">
						<P>
							Die astronomischen Berechnungen erfolgen nach etablierten Verfahren und werden gegen
							Referenzimplementierungen getestet. Dennoch gilt:
						</P>
						<p className="rounded-panel border border-warning/50 bg-card px-4 py-3 text-sm font-medium text-card-foreground">
							Alle Angaben erfolgen ohne Gewähr.
						</p>
						<P>Insbesondere wird keine Gewähr übernommen für:</P>
						<List>
							<li>
								die Richtigkeit, Genauigkeit und Aktualität der berechneten Sonnenstände und Zeiten,
							</li>
							<li>
								die Richtigkeit von Karten-, Höhen- und Gebäudedaten sowie von
								Geokodierungsergebnissen, die von Drittanbietern stammen,
							</li>
							<li>
								Abweichungen durch lokale Topografie, Bebauung, Vegetation, Wetter, atmosphärische
								Refraktion oder ungenaue Standort- und Zeitzonenangaben,
							</li>
							<li>die Eignung der Ergebnisse für einen bestimmten Zweck.</li>
						</List>
						<P>
							Die Ergebnisse sind ein Planungshilfsmittel und ersetzen keine Prüfung vor Ort.
							Entscheidungen mit wirtschaftlicher, sicherheitsrelevanter oder rechtlicher Tragweite
							dürfen nicht allein auf Grundlage der App getroffen werden.
						</P>
					</Section>

					<Section id="haftung" title="4. Haftungsausschluss">
						<P>
							Der Betreiber haftet nicht für Schäden, die aus der Nutzung oder Nichtverfügbarkeit
							der App entstehen — insbesondere nicht für entgangenen Gewinn, vergebliche
							Aufwendungen, verpasste Aufnahmezeitfenster oder Folgeschäden.
						</P>
						<P>
							Ausgenommen von diesem Haftungsausschluss bleibt die Haftung für Vorsatz und grobe
							Fahrlässigkeit sowie eine allfällige zwingende gesetzliche Haftung (z. B. für
							Personenschäden oder nach dem Produktehaftpflichtgesetz). Soweit die Haftung
							ausgeschlossen oder beschränkt ist, gilt dies auch für Hilfspersonen.
						</P>
						<P>
							Die App bindet Dienste Dritter ein (Kartendaten, Geokodierung, 3D-Terrain). Für deren
							Inhalte, Verfügbarkeit und Datenschutzpraxis ist der jeweilige Anbieter
							verantwortlich; siehe dazu die{' '}
							<a href="#datenschutz" className="underline underline-offset-2">
								Datenschutzerklärung
							</a>
							.
						</P>
					</Section>

					<Section id="nutzung" title="5. Zulässige Nutzung">
						<P>
							Die App darf nicht in einer Weise genutzt werden, die den Betrieb beeinträchtigt,
							insbesondere nicht durch automatisierte Massenabfragen, Umgehung technischer
							Schutzmassnahmen oder Nutzung der eingebundenen Drittanbieter-Dienste ausserhalb von
							deren Nutzungsbedingungen.
						</P>
					</Section>

					<Section id="rechte-inhalte" title="6. Rechte an Inhalten">
						<P>
							Der Quellcode der App steht unter der AGPL-3.0-Lizenz. Karten-, Terrain- und Geodaten
							unterliegen den Lizenzen der jeweiligen Anbieter (u. a. OpenStreetMap-Mitwirkende) und
							sind entsprechend zu attribuieren.
						</P>
					</Section>

					<Section id="recht" title="7. Anwendbares Recht und Gerichtsstand">
						<P>
							Es gilt schweizerisches Recht unter Ausschluss der Kollisionsnormen. Gerichtsstand ist
							Zürich, Schweiz, soweit nicht zwingende gesetzliche Bestimmungen — insbesondere
							zugunsten von Konsument:innen mit Wohnsitz in der EU — einen anderen Gerichtsstand
							vorschreiben.
						</P>
					</Section>

					<Section id="aenderungen-agb" title="8. Änderungen">
						<P>
							Der Betreiber kann diese Nutzungsbedingungen jederzeit anpassen. Massgebend ist die
							jeweils auf dieser Seite veröffentlichte Fassung.
						</P>
					</Section>
				</article>
			</div>
		</main>
	);
}
