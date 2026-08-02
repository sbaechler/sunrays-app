import { CONTACT_EMAIL, Ext, List, P, Section, STAND_EN, SubHeading } from './shared';

/**
 * Englische Übersetzung der Rechtsseite. Zur Orientierung — massgebend ist
 * die deutsche Fassung (siehe Hinweis im Header).
 */
export default function RechtlichesEn() {
	return (
		<main className="mx-auto max-w-3xl px-5 py-10 sm:px-8 sm:py-14">
			<nav className="mb-8">
				<a
					href="/"
					className="text-sm text-muted-foreground underline decoration-border underline-offset-4 transition-colors hover:text-foreground"
				>
					← Back to the map
				</a>
			</nav>

			<header className="mb-10 space-y-2">
				<h1 className="text-3xl font-semibold tracking-tight text-foreground">Legal</h1>
				<p className="text-sm text-muted-foreground">Last updated: {STAND_EN}</p>
				<p className="text-sm text-muted-foreground">
					<a href="#datenschutz" className="underline underline-offset-2">
						Privacy policy
					</a>
					{' · '}
					<a href="#nutzungsbedingungen" className="underline underline-offset-2">
						Terms of use
					</a>
				</p>
				<p className="text-xs text-muted-foreground">
					This English translation is provided for convenience only. In case of discrepancies, the
					German version prevails.
				</p>
			</header>

			<div className="space-y-12">
				<article id="datenschutz" className="scroll-mt-24 space-y-8">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">Privacy policy</h1>

					<Section id="verantwortlicher" title="1. Controller">
						<P>
							Simon Bächler
							<br />
							Zurich, Switzerland
							<br />
							Email: <Ext href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Ext>
						</P>
					</Section>

					<Section id="grundsaetze" title="2. Principles">
						<P>
							We take the protection of your personal data seriously. Sunrays is a purely static
							web application hosted on Cloudflare. There is no user account, no registration and
							no server-side database.
						</P>
						<P>
							We ourselves create{' '}
							<strong className="font-medium text-foreground">no user profiles</strong> and do not
							store any content you enter. However, operating the app — as with any website —
							generates technical data, and the app embeds third-party services that receive your
							IP address and your search queries. Sections 3 to 6 explain exactly what this means.
						</P>
						<P>
							The legal basis for the processing described below is our legitimate interest in the
							secure, functional and needs-based operation of the app (Art. 6(1)(f) GDPR and
							Art. 31(1) Swiss FADP).
						</P>
					</Section>

					<Section id="hosting" title="3. Hosting and server logs (Cloudflare)">
						<P>
							The app is delivered via Cloudflare (Cloudflare, Inc., USA, with data centres
							worldwide). When the page is accessed, Cloudflare processes technically necessary
							connection data such as IP address, time, requested resource, referrer and
							user agent. This is required for delivery and for defending against attacks.
						</P>
						<P>
							Cloudflare processes this data as a processor on the basis of a data processing
							agreement; for transfers to the USA, Cloudflare relies on the EU Standard Contractual
							Clauses and the EU-US Data Privacy Framework.
						</P>
					</Section>

					<Section id="analytics" title="4. Audience measurement">
						<SubHeading>Cloudflare Web Analytics</SubHeading>
						<P>
							We use Cloudflare Web Analytics to analyse the use of the website anonymously. The
							service works without cookies and without fingerprinting. Only the following is
							collected:
						</P>
						<List>
							<li>truncated/anonymised IP address</li>
							<li>operating system and browser type</li>
							<li>approximate geographic region (country/region)</li>
							<li>pages visited and time spent</li>
							<li>referrer (which page you came from)</li>
						</List>
						<P>
							No persistent cookies are set, no cross-site tracking mechanisms are used and no
							personal profiles are created.
						</P>
					</Section>

					<Section id="dritte" title="5. Embedded third-party services">
						<P>
							For the app to work, your browser fetches content directly from the following
							providers. In doing so, your IP address is transmitted to the respective provider —
							technically unavoidable, as the content could not otherwise be delivered. We have no
							influence on how these providers further process the data; their privacy policies
							apply.
						</P>

						<SubHeading>5.1 Location search / geocoding</SubHeading>
						<P>
							When you use the search field, the search term you enter is sent together with your
							IP address to a geocoding service to find places:
						</P>
						<List>
							<li>
								<strong className="font-medium text-foreground">Photon</strong> (photon.komoot.io),
								Komoot GmbH, Germany —{' '}
								<Ext href="https://www.komoot.com/privacy">komoot.com/privacy</Ext>
							</li>
							<li>
								<strong className="font-medium text-foreground">Geoapify Geocoding</strong>{' '}
								(api.geoapify.com), Geoapify GmbH, Germany —{' '}
								<Ext href="https://www.geoapify.com/privacy-policy/">
									geoapify.com/privacy-policy
								</Ext>
							</li>
						</List>
						<P>
							Search terms may reveal your interests or planned whereabouts. If you want to avoid
							this, place the marker directly by clicking on the map instead — then no search
							request takes place.
						</P>

						<SubHeading>5.2 Map data (2D)</SubHeading>
						<P>
							The map tiles come from OpenFreeMap (tiles.openfreemap.org), a free, non-profit map
							service based on OpenStreetMap data. Your IP address and the requested tile
							coordinates are transmitted — which reveals the map area you are viewing. OpenFreeMap
							states that it keeps no logs containing personal data (
							<Ext href="https://openfreemap.org/">openfreemap.org</Ext>).
						</P>

						<SubHeading>5.3 3D terrain and buildings</SubHeading>
						<P>
							In the 3D view, terrain and building data are loaded from Cesium ion (Cesium GS,
							Inc., USA). Your IP address and the requested tile coordinates are transmitted. This
							involves a data transfer to the USA. Privacy policy:{' '}
							<Ext href="https://cesium.com/legal/privacy-policy/">
								cesium.com/legal/privacy-policy
							</Ext>
							.
						</P>
						<P>
							If you want to avoid this, use the 2D view only — the 3D data is only loaded when you
							switch to the 3D view.
						</P>
					</Section>

					<Section id="lokal" title="6. Local storage in the browser and location">
						<List>
							<li>
								<strong className="font-medium text-foreground">localStorage:</strong> We store
								your language and theme preference (sunrays-locale, sunrays-theme) locally in your
								browser. This data never leaves your device and is not transmitted to us. You can
								delete it at any time via your browser settings.
							</li>
							<li>
								<strong className="font-medium text-foreground">Geolocation:</strong> If you use
								the “Use current position” feature, your browser asks for your permission and
								determines the coordinates. These are used only locally to display the marker and
								are not sent to us or to third parties.
							</li>
							<li>
								<strong className="font-medium text-foreground">Share links:</strong> When sharing
								a view, the location, date and zoom level are written into the URL. If you pass on
								such a link, you also pass on this information.
							</li>
						</List>
					</Section>

					<Section id="rechte" title="7. Your rights">
						<P>
							Under the GDPR and the Swiss FADP, you have in particular the following rights
							vis-à-vis the controller: access, rectification, erasure, restriction of processing,
							data portability and objection to processing based on legitimate interest.
						</P>
						<P>
							Since we ourselves store no personal data about individual users, we can usually only
							provide a negative confirmation — we simply have nothing that could be attributed to
							you. For data generated at the providers named in section 5, please contact them
							directly.
						</P>
						<P>
							You also have the right to lodge a complaint with a supervisory authority — in
							Switzerland with the Federal Data Protection and Information Commissioner (FDPIC), in
							the EU with the data protection authority of your country of residence.
						</P>
						<P>
							For questions, you can reach us at{' '}
							<Ext href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Ext>.
						</P>
					</Section>

					<Section id="aenderungen-datenschutz" title="8. Changes to this privacy policy">
						<P>
							We reserve the right to amend this privacy policy to adapt it to changed legal
							requirements or changes to the app. The version published on this page at the
							relevant time is authoritative.
						</P>
					</Section>
				</article>

				<hr className="border-border" />

				<article id="nutzungsbedingungen" className="scroll-mt-24 space-y-8">
					<h1 className="text-2xl font-semibold tracking-tight text-foreground">Terms of use</h1>

					<Section id="geltungsbereich" title="1. Scope">
						<P>
							These terms of use govern the use of the Sunrays web app (hereinafter “the app”). By
							using the app, you agree to these terms.
						</P>
						<P>
							Operator: Simon Bächler, Zurich, Switzerland —{' '}
							<Ext href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</Ext>
						</P>
					</Section>

					<Section id="leistung" title="2. Description of the service">
						<P>
							The app calculates and visualises the sun’s path (azimuth, elevation, sunrise and
							sunset times, twilight phases) for a freely selectable location and time. It is aimed
							at photographers, cinematographers and other people planning shoots.
						</P>
						<P>
							Use is free of charge. There is no entitlement to availability, a particular feature
							set or the continued existence of the app. The operator may change, restrict or
							discontinue the app at any time.
						</P>
					</Section>

					<Section id="gewaehr" title="3. No warranty for calculations and map data">
						<P>
							The astronomical calculations follow established methods and are tested against
							reference implementations. Nevertheless:
						</P>
						<p className="rounded-panel border border-warning/50 bg-card px-4 py-3 text-sm font-medium text-card-foreground">
							All information is provided without warranty.
						</p>
						<P>In particular, no warranty is given for:</P>
						<List>
							<li>
								the correctness, accuracy and currency of the calculated sun positions and times,
							</li>
							<li>
								the correctness of map, elevation and building data and of geocoding results
								originating from third-party providers,
							</li>
							<li>
								deviations due to local topography, buildings, vegetation, weather, atmospheric
								refraction or inaccurate location and time zone information,
							</li>
							<li>the suitability of the results for a particular purpose.</li>
						</List>
						<P>
							The results are a planning aid and do not replace on-site verification. Decisions
							with economic, safety-related or legal implications must not be made solely on the
							basis of the app.
						</P>
					</Section>

					<Section id="haftung" title="4. Limitation of liability">
						<P>
							The operator is not liable for damage arising from the use or unavailability of the
							app — in particular not for lost profit, wasted expenditure, missed shooting windows
							or consequential damage.
						</P>
						<P>
							Excluded from this limitation is liability for intent and gross negligence as well as
							any mandatory statutory liability (e.g. for personal injury or under product
							liability law). Where liability is excluded or limited, this also applies to
							auxiliary persons.
						</P>
						<P>
							The app embeds third-party services (map data, geocoding, 3D terrain). The respective
							provider is responsible for their content, availability and data protection practice;
							see the{' '}
							<a href="#datenschutz" className="underline underline-offset-2">
								privacy policy
							</a>
							.
						</P>
					</Section>

					<Section id="nutzung" title="5. Permitted use">
						<P>
							The app must not be used in a way that impairs its operation, in particular not
							through automated bulk queries, circumvention of technical protection measures or use
							of the embedded third-party services outside their terms of use.
						</P>
					</Section>

					<Section id="rechte-inhalte" title="6. Rights to content">
						<P>
							The app’s source code is licensed under the AGPL-3.0 licence. Map, terrain and
							geodata are subject to the licences of the respective providers (including
							OpenStreetMap contributors) and must be attributed accordingly.
						</P>
					</Section>

					<Section id="recht" title="7. Applicable law and jurisdiction">
						<P>
							Swiss law applies, excluding its conflict-of-laws rules. The place of jurisdiction is
							Zurich, Switzerland, unless mandatory statutory provisions — in particular in favour
							of consumers residing in the EU — prescribe a different place of jurisdiction.
						</P>
					</Section>

					<Section id="aenderungen-agb" title="8. Changes">
						<P>
							The operator may amend these terms of use at any time. The version published on this
							page at the relevant time is authoritative.
						</P>
					</Section>
				</article>
			</div>
		</main>
	);
}
