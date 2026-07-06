/**
 * Solar-Engine — TypeScript-Port der Legacy-Berechnung (Story 2.2).
 *
 * Portiert aus `src/sunrays/sonnenmodul2.py` (A. Barmettler / astronomie.info),
 * algorithmisch unverändert, nur Sonnen-Pfad (kein Mond, keine Dämmerungen).
 * Verifiziert durch Golden-Tests gegen `sun-golden-fixtures.json` (NFR3:
 * ±0,1° Winkel, ±1 min Zeiten).
 *
 * Konventionen:
 * - Azimut: Grad ab Nord, im Uhrzeigersinn (0=N, 90=O, 180=S, 270=W)
 * - Elevation: `altitudeTrueDeg` ohne, `altitudeRefractedDeg` mit Refraktion
 *   (Standardatmosphäre 1015 mbar / 20 °C)
 * - Gültigkeitsbereich wie Legacy: Jahre 1901–2099, |Breitengrad| ≤ 65°
 */

const DEG = Math.PI / 180.0;
const RAD = 180.0 / Math.PI;

/** Druck/Temperatur der Standardatmosphäre für die Refraktion (wie Legacy). */
const QFE = 1015; // mbar
const TEMPERATURE = 20; // °C

/** TDT-UT-Differenz in Sekunden (Legacy-Konstante). */
const DELTA_T_SECONDS = 65;

/** Legacy-Gültigkeitsgrenze für den Breitengrad. */
export const MAX_ABS_LATITUDE_DEG = 65;

// ---------------------------------------------------------------------------
// Hilfsfunktionen (1:1 aus der Legacy-Quelle)
// ---------------------------------------------------------------------------

const frac = (x: number): number => x - Math.floor(x);

/** Python math.fmod — identisch zu JS `%` (Vorzeichen des Dividenden). */
const mod = (a: number, b: number): number => a % b;

const mod2Pi = (x: number): number => {
	let ang = mod(x, 2.0 * Math.PI);
	if (ang < 0) ang += 2.0 * Math.PI;
	return ang;
};

/** Ganzzahl Richtung 0 (Python `Int`). */
const int = (x: number): number => Math.trunc(x);

interface EquatorialCoor {
	lon: number;
	lat: number;
	anomalyMean: number;
	distance: number;
	diameter: number;
	parallax: number;
	ra: number;
	dec: number;
}

interface HorizontalCoor extends EquatorialCoor {
	az: number;
	alt: number;
}

/** Julianisches Datum; gültig 1.3.1901 – 28.2.2100 (Legacy-Algorithmus). */
export function calcJD(year: number, month: number, day: number): number {
	let y = year;
	let m = month;
	let jd = 2415020.5 - 64; // 1.1.1900 — Korrektur des Algorithmus
	if (m <= 2) {
		y -= 1;
		m += 12;
	}
	jd += int((y - 1900) * 365.25);
	jd += int(30.6001 * (1 + m));
	return jd + day;
}

/** Julianisches Datum → mittlere Greenwich-Sternzeit (Stunden). */
export function gmst(jd: number): number {
	const ut = frac(jd - 0.5) * 24.0; // UT in Stunden
	const jd0 = Math.floor(jd - 0.5) + 0.5; // JD um 0h UT
	const t = (jd0 - 2451545.0) / 36525.0;
	const t0 = 6.697374558 + t * (2400.051336 + t * 0.000025862);
	return mod(t0 + ut * 1.002737909, 24.0);
}

/** Greenwich-Sternzeit → UT (Stunden). */
function gmst2UT(jd: number, gmstHours: number): number {
	const jd0 = Math.floor(jd - 0.5) + 0.5;
	const t = (jd0 - 2451545.0) / 36525.0;
	const t0 = mod(6.697374558 + t * (2400.051336 + t * 0.000025862), 24.0);
	return 0.9972695663 * (gmstHours - t0);
}

/** Lokale mittlere Sternzeit; Länge in Radiant, Ost positiv. */
function gmst2LMST(gmstHours: number, lonRad: number): number {
	return mod(gmstHours + (RAD * lonRad) / 15, 24.0);
}

/** Ekliptikale (lon/lat) → äquatoriale Koordinaten (RA/Dec). */
function ecl2Equ<T extends { lon: number; lat: number }>(
	coor: T,
	tdt: number,
): T & { ra: number; dec: number } {
	const t = (tdt - 2451545.0) / 36525.0; // Epoche 2000, 1. Januar 12h
	const eps =
		(23.0 + (26 + 21.45 / 60.0) / 60.0 + (t * (-46.815 + t * (-0.0006 + t * 0.00181))) / 3600.0) *
		DEG;
	const coseps = Math.cos(eps);
	const sineps = Math.sin(eps);
	const sinlon = Math.sin(coor.lon);
	const ra = mod2Pi(Math.atan2(sinlon * coseps - Math.tan(coor.lat) * sineps, Math.cos(coor.lon)));
	const dec = Math.asin(Math.sin(coor.lat) * coseps + Math.cos(coor.lat) * sineps * sinlon);
	return { ...coor, ra, dec };
}

/** Äquatoriale (RA/Dec) → Horizontkoordinaten (Azimut/Höhe), ohne Refraktion. */
function equ2Altaz<T extends { ra: number; dec: number }>(
	coor: T,
	geolatRad: number,
	lmstRad: number,
): T & { az: number; alt: number } {
	const cosdec = Math.cos(coor.dec);
	const sindec = Math.sin(coor.dec);
	const lha = lmstRad - coor.ra;
	const coslha = Math.cos(lha);
	const sinlha = Math.sin(lha);
	const coslat = Math.cos(geolatRad);
	const sinlat = Math.sin(geolatRad);

	const n = -cosdec * sinlha;
	const d = sindec * coslat - cosdec * coslha * sinlat;
	const az = mod2Pi(Math.atan2(n, d));
	const alt = Math.asin(sindec * sinlat + cosdec * coslha * coslat);
	return { ...coor, az, alt };
}

/**
 * Sonnenkoordinaten zum Zeitpunkt TDT (Julianisches Datum).
 * Genauigkeit lt. Legacy: ~10s (RA), einige Bogenminuten (Dec).
 */
export function sunPosition(
	tdt: number,
	geolatRad?: number,
	lmstRad?: number,
): EquatorialCoor | HorizontalCoor {
	const d = tdt - 2447891.5;
	const eg = 279.403303 * DEG;
	const wg = 282.768422 * DEG;
	const e = 0.016713;
	const a = 149598500; // km
	const diameter0 = 0.533128 * DEG;

	const mSun = ((360 * DEG) / 365.242191) * d + eg - wg;
	const nu = mSun + ((360.0 * DEG) / Math.PI) * e * Math.sin(mSun);

	let distance = (1 - e * e) / (1 + e * Math.cos(nu)); // AE
	const diameter = diameter0 / distance;
	distance *= a; // km
	const parallax = 6378.137 / distance;

	const sunCoor: EquatorialCoor = ecl2Equ(
		{
			lon: mod2Pi(nu + wg),
			lat: 0,
			anomalyMean: mSun,
			distance,
			diameter,
			parallax,
			ra: 0,
			dec: 0,
		},
		tdt,
	);

	if (geolatRad !== undefined && lmstRad !== undefined) {
		return equ2Altaz(sunCoor, geolatRad, lmstRad);
	}
	return sunCoor;
}

/**
 * Refraktion nach Standardatmosphäre. Eingabe: wahre Höhe in Radiant.
 * Rückgabe: Hebung in GRAD (wie von der Legacy-Quelle verwendet).
 */
export function refraction(altRad: number): number {
	const altdeg = altRad * RAD;
	if (altdeg < -2 || altdeg >= 90) return 0;

	if (altdeg > 15) {
		return (0.00452 * QFE) / ((273 + TEMPERATURE) * Math.tan(altRad));
	}

	let y = altRad;
	let dRef = 0.0;
	const p = (QFE - 80.0) / 930.0;
	const q = 0.0048 * (TEMPERATURE - 10.0);
	let y0 = y;
	let d0 = dRef;
	let n: number;

	for (let i = 0; i < 3; i++) {
		n = y + 7.31 / (y + 4.4);
		n = 1.0 / Math.tan(n * DEG);
		dRef = (n * p) / (60.0 + q * (n + 39.0));
		n = y - y0;
		y0 = dRef - d0 - n;
		if (n !== 0.0 && y0 !== 0.0) {
			n = y - (n * (altRad + dRef - y)) / y0;
		} else {
			n = altRad + dRef;
		}
		y0 = y;
		d0 = dRef;
		y = n;
	}
	return dRef;
}

// ---------------------------------------------------------------------------
// Auf-/Untergang (Sonne)
// ---------------------------------------------------------------------------

interface RiseSetGMST {
	transit: number;
	rise: number;
	set: number;
}

/**
 * Greenwich-Sternzeit von Aufgang/Untergang/Kulmination.
 * `h`: geforderte Höhe des Scheibenzentrums (Radiant). null = zirkumpolar
 * bzw. Objekt bleibt unter dem Horizont.
 */
function gmstRiseSet(
	coor: { ra: number; dec: number },
	lonRad: number,
	latRad: number,
	h: number,
): RiseSetGMST | null {
	const cosArg =
		(Math.sin(h) - Math.sin(latRad) * Math.sin(coor.dec)) / (Math.cos(latRad) * Math.cos(coor.dec));
	if (cosArg < -1 || cosArg > 1) return null; // Python: ValueError von acos
	const tagbogen = Math.acos(cosArg);

	return {
		transit: mod((RAD / 15) * (coor.ra - lonRad), 24),
		rise: mod(24.0 + (RAD / 15) * (-tagbogen + coor.ra - lonRad), 24),
		set: mod((RAD / 15) * (tagbogen + coor.ra - lonRad), 24),
	};
}

function interpolateGMST(gmst0: number, gmst1: number, gmst2: number, timefactor: number): number {
	return (
		(timefactor * 24.07 * gmst1 - gmst0 * (gmst2 - gmst1)) / (timefactor * 24.07 + gmst1 - gmst2)
	);
}

/**
 * Auf-/Untergang in UT. `jd0UT` ist das Julianische Datum um 0h UT.
 * Abweichung zur Legacy: dort führte genau ein fehlendes von zwei
 * Tages-Ergebnissen zu einem Laufzeitfehler; hier wird in dem Fall
 * (wie bei beidseitigem Fehlen) null zurückgegeben.
 */
function riseSet(
	jd0UT: number,
	coor1: EquatorialCoor,
	coor2: EquatorialCoor,
	lonRad: number,
	latRad: number,
	timeinterval: number,
): RiseSetGMST | null {
	// Höhe des Sonnenzentrums: Halbmesser, Parallaxe, Standard-Refraktion 34'
	const alt = 0.5 * coor1.diameter - coor1.parallax + (34.0 / 60) * DEG;

	const rise1 = gmstRiseSet(coor1, lonRad, latRad, 0);
	const rise2 = gmstRiseSet(coor2, lonRad, latRad, 0);
	if (!rise1 || !rise2) return null;

	// GMST-Sprung über 24h -> 0h entfalten
	if (rise1.transit > rise2.transit && Math.abs(rise1.transit - rise2.transit) > 18)
		rise2.transit += 24;
	if (rise1.rise > rise2.rise && Math.abs(rise1.rise - rise2.rise) > 18) rise2.rise += 24;
	if (rise1.set > rise2.set && Math.abs(rise1.set - rise2.set) > 18) rise2.set += 24;

	const t0 = gmst(jd0UT);
	// Greenwich-Sternzeit für 0h an der gewählten Länge
	let t02 = t0 - ((lonRad * RAD) / 15) * 1.002738;
	if (t02 < 0) t02 += 24;

	if (rise1.transit < t02) {
		rise1.transit += 24;
		rise2.transit += 24;
	}
	if (rise1.rise < t02) {
		rise1.rise += 24;
		rise2.rise += 24;
	}
	if (rise1.set < t02) {
		rise1.set += 24;
		rise2.set += 24;
	}

	// Korrektur für Refraktion und Parallaxe
	const decMean = 0.5 * (coor1.dec + coor2.dec);
	const psi = Math.acos(Math.sin(latRad) / Math.cos(decMean));
	const y = Math.asin(Math.sin(alt) / Math.sin(psi));
	const dt = (240 * RAD * y) / Math.cos(decMean) / 3600;

	return {
		transit: gmst2UT(jd0UT, interpolateGMST(t0, rise1.transit, rise2.transit, timeinterval)),
		rise: gmst2UT(jd0UT, interpolateGMST(t0, rise1.rise, rise2.rise, timeinterval) - dt),
		set: gmst2UT(jd0UT, interpolateGMST(t0, rise1.set, rise2.set, timeinterval) + dt),
	};
}

/**
 * Sonnenauf-/-untergang und Kulmination in lokaler Zeit (Dezimalstunden).
 * `jd` ist das Julianische Datum um 0h LOKALER Zeit, `zoneHours` der
 * UTC-Offset. Genauigkeit lt. Legacy ~1–2 Minuten.
 */
function sunRise(
	jd: number,
	deltaT: number,
	lonRad: number,
	latRad: number,
	zoneHours: number,
	recursive: boolean,
): RiseSetGMST | null {
	const jd0UT = Math.floor(jd - 0.5) + 0.5;
	const coor1 = sunPosition(jd0UT + deltaT / 24.0 / 3600.0);
	const coor2 = sunPosition(jd0UT + 1.0 + deltaT / 24.0 / 3600.0);

	const rise = riseSet(jd0UT, coor1, coor2, lonRad, latRad, 1);
	if (!rise) return null;

	if (!recursive) {
		// Auf lokalen Kalendertag schieben
		if (zoneHours > 0) {
			if (
				rise.rise >= 24 - zoneHours ||
				rise.transit >= 24 - zoneHours ||
				rise.set >= 24 - zoneHours
			) {
				const risetemp = sunRise(jd + 1, deltaT, lonRad, latRad, zoneHours, true);
				if (risetemp) {
					if (rise.rise >= 24 - zoneHours) rise.rise = risetemp.rise;
					if (rise.transit >= 24 - zoneHours) rise.transit = risetemp.transit;
					if (rise.set >= 24 - zoneHours) rise.set = risetemp.set;
				}
			}
		} else if (zoneHours < 0) {
			if (rise.rise < -zoneHours || rise.transit < -zoneHours || rise.set < -zoneHours) {
				const risetemp = sunRise(jd - 1, deltaT, lonRad, latRad, zoneHours, true);
				if (risetemp) {
					if (rise.rise < -zoneHours) rise.rise = risetemp.rise;
					if (rise.transit < -zoneHours) rise.transit = risetemp.transit;
					if (rise.set < -zoneHours) rise.set = risetemp.set;
				}
			}
		}
		rise.transit = mod(rise.transit + zoneHours, 24.0);
		rise.rise = mod(rise.rise + zoneHours, 24.0);
		rise.set = mod(rise.set + zoneHours, 24.0);
	}
	return rise;
}

// ---------------------------------------------------------------------------
// Öffentliche API
// ---------------------------------------------------------------------------

export interface LocalDateTime {
	year: number;
	/** 1–12 */
	month: number;
	day: number;
	hour: number;
	minute?: number;
	second?: number;
}

export interface SunPositionResult {
	/** Grad ab Nord, im Uhrzeigersinn. */
	azimuthDeg: number;
	/** Elevation ohne Refraktion, Grad. */
	altitudeTrueDeg: number;
	/** Elevation inkl. Refraktion (1015 mbar / 20 °C), Grad. */
	altitudeRefractedDeg: number;
}

export interface SunEvents {
	/** Lokale Dezimalstunden oder null (kein Ereignis am Tag). */
	sunRiseHours: number | null;
	sunSetHours: number | null;
	sunTransitHours: number | null;
}

export interface SunPathHour extends SunPositionResult {
	/** Volle lokale Stunde 0–23. */
	localHour: number;
	utcOffsetHours: number;
}

export interface SunPath extends SunEvents {
	hours: SunPathHour[];
}

function assertRange(latDeg: number, year: number): void {
	if (year <= 1900 || year >= 2100) {
		throw new RangeError('Berechnungen sind nur für die Zeitperiode 1901–2099 gültig.');
	}
	if (Math.abs(latDeg) > MAX_ABS_LATITUDE_DEG) {
		throw new RangeError(
			`Breitengrad ausserhalb des gültigen Bereichs (|lat| <= ${MAX_ABS_LATITUDE_DEG}°).`,
		);
	}
}

/** Lokale Zeit − Offset → UTC-Komponenten (gültig für 1901–2099). */
function toUTC(local: LocalDateTime, utcOffsetHours: number) {
	const ms =
		Date.UTC(
			local.year,
			local.month - 1,
			local.day,
			local.hour,
			local.minute ?? 0,
			local.second ?? 0,
		) -
		utcOffsetHours * 3600_000;
	const u = new Date(ms);
	return {
		year: u.getUTCFullYear(),
		month: u.getUTCMonth() + 1,
		day: u.getUTCDate(),
		hour: u.getUTCHours(),
		minute: u.getUTCMinutes(),
		second: u.getUTCSeconds(),
	};
}

/**
 * Sonnenposition (Azimut/Elevation) für einen Ort und lokalen Zeitpunkt.
 * `utcOffsetHours`: UTC-Offset der lokalen Zeit (DST-korrekt, z. B. via
 * IANA-Zeitzonen-Lookup — Story 2.3).
 */
export function computeSunPosition(
	latDeg: number,
	lonDeg: number,
	local: LocalDateTime,
	utcOffsetHours: number,
): SunPositionResult {
	const utc = toUTC(local, utcOffsetHours);
	assertRange(latDeg, utc.year);

	const jd0 = calcJD(utc.year, utc.month, utc.day);
	const jd = jd0 + (utc.hour + utc.minute / 60.0 + utc.second / 3600.0) / 24.0;
	const tdt = jd + DELTA_T_SECONDS / 24.0 / 3600.0;
	const latRad = latDeg * DEG;
	const lonRad = lonDeg * DEG;

	const gmstHours = gmst(jd);
	const lmst = gmst2LMST(gmstHours, lonRad);

	const coor = sunPosition(tdt, latRad, lmst * 15.0 * DEG) as HorizontalCoor;
	const altTrue = coor.alt;
	const altRefracted = altTrue + refraction(altTrue) * DEG;

	return {
		azimuthDeg: coor.az * RAD,
		altitudeTrueDeg: altTrue * RAD,
		altitudeRefractedDeg: altRefracted * RAD,
	};
}

/**
 * Sonnenauf-/-untergang und Kulmination für einen lokalen Kalendertag.
 * `utcOffsetHours` ist der Offset des Tages (bei DST-Wechseltagen: der
 * Offset, mit dem die Zeiten interpretiert werden sollen, z. B. mittags).
 */
export function computeSunEvents(
	latDeg: number,
	lonDeg: number,
	date: { year: number; month: number; day: number },
	utcOffsetHours: number,
): SunEvents {
	const utc = toUTC({ ...date, hour: 12 }, utcOffsetHours);
	assertRange(latDeg, utc.year);
	const jd0 = calcJD(utc.year, utc.month, utc.day);
	const rise = sunRise(jd0, DELTA_T_SECONDS, lonDeg * DEG, latDeg * DEG, utcOffsetHours, false);
	return {
		sunRiseHours: rise ? rise.rise : null,
		sunSetHours: rise ? rise.set : null,
		sunTransitHours: rise ? rise.transit : null,
	};
}

/**
 * Kompletter Tagesverlauf: Position zu jeder vollen lokalen Stunde plus
 * Auf-/Untergang/Kulmination (Grundlage des Fächers, FR5).
 *
 * `utcOffset`: konstanter Offset oder Funktion `(localHour) => offset`
 * für DST-Wechseltage.
 */
export function computeSunPath(
	latDeg: number,
	lonDeg: number,
	date: { year: number; month: number; day: number },
	utcOffset: number | ((localHour: number) => number),
): SunPath {
	const offsetAt = typeof utcOffset === 'number' ? () => utcOffset : utcOffset;

	const hours: SunPathHour[] = [];
	for (let h = 0; h < 24; h++) {
		const offset = offsetAt(h);
		const pos = computeSunPosition(latDeg, lonDeg, { ...date, hour: h }, offset);
		hours.push({ localHour: h, utcOffsetHours: offset, ...pos });
	}

	return {
		...computeSunEvents(latDeg, lonDeg, date, offsetAt(12)),
		hours,
	};
}
