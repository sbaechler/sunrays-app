/**
 * 3D-Ansicht (Epic 4, FR8): CesiumJS.
 *
 * Datenquellen (Spike-Report 2026-07-06):
 * - Mit VITE_CESIUM_ION_TOKEN: Cesium World Terrain + Cesium OSM Buildings
 *   (ion Community Plan).
 * - Ohne Token: Ellipsoid + mitgelieferte NaturalEarthII-Textur (lizenzfrei),
 *   plus Hinweisbanner "3D-Daten nicht verfügbar" (FR10) — die App bleibt
 *   funktionsfähig, der Fächer ist trotzdem räumlich lesbar.
 *
 * Der Fächer (Story 4.3) wird als Polylines + Labels am Marker gerendert;
 * Elevation = tatsächlicher Sonnenstand. Klick setzt den Marker neu (FR2).
 */
import type { MarkerPosition } from '#/Map/state';
import { trackEvent } from '#/Settings/telemetry';
import type { SunPath } from '@repo/solar';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { useEffect, useRef, useState } from 'react';

const FAN_LENGTH_METERS = 250;

export interface CesiumViewProps {
	marker: MarkerPosition | null;
	path: SunPath | null;
	/** 2D-Zoom, damit die Kamera-Höhe beim Wechsel ungefähr passt (FR9). */
	zoom2d: number | null;
	onMarkerChange: (marker: MarkerPosition) => void;
	/** FR10: keine hochwertigen 3D-Daten verfügbar (Token fehlt / Fehler). */
	onDataQuality: (quality: 'full' | 'degraded') => void;
}

function zoomToHeight(zoom: number | null): number {
	// grobe Web-Mercator-Äquivalenz; Default: Stadt-Ansicht
	if (zoom === null) return 3000;
	return Math.max(800, 40_075_000 / Math.pow(2, zoom + 1));
}

export function CesiumView({
	marker,
	path,
	zoom2d,
	onMarkerChange,
	onDataQuality,
}: CesiumViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<Cesium.Viewer | null>(null);
	const fanPrimitivesRef = useRef<Cesium.PrimitiveCollection | null>(null);
	const markerEntityRef = useRef<Cesium.Entity | null>(null);
	const callbacksRef = useRef({ onMarkerChange, onDataQuality });
	callbacksRef.current = { onMarkerChange, onDataQuality };
	const [ready, setReady] = useState(false);
	const [terrainReady, setTerrainReady] = useState(false);

	// Viewer initialisieren
	useEffect(() => {
		if (!containerRef.current || viewerRef.current) return;
		let disposed = false;

		const token = import.meta.env.VITE_CESIUM_ION_TOKEN as string | undefined;
		if (token) Cesium.Ion.defaultAccessToken = token;

		const viewer = new Cesium.Viewer(containerRef.current, {
			animation: false,
			timeline: false,
			baseLayerPicker: false,
			geocoder: false,
			homeButton: false,
			sceneModePicker: false,
			navigationHelpButton: false,
			fullscreenButton: false,
			infoBox: false,
			selectionIndicator: false,
			requestRenderMode: true,
			maximumRenderTimeChange: Infinity,
			baseLayer: token
				? undefined
				: Cesium.ImageryLayer.fromProviderAsync(
						Cesium.TileMapServiceImageryProvider.fromUrl(
							Cesium.buildModuleUrl('Assets/Textures/NaturalEarthII'),
						),
					),
		});
		viewer.scene.globe.depthTestAgainstTerrain = true;
		if (import.meta.env.DEV) {
			(window as unknown as { __sunraysViewer?: Cesium.Viewer }).__sunraysViewer = viewer;
		}
		viewer.scene.renderError.addEventListener((_scene, error) => {
			 
			console.error('Cesium renderError:', error instanceof Error ? error.message : error);
		});
		viewerRef.current = viewer;

		void (async () => {
			if (!token) {
				callbacksRef.current.onDataQuality('degraded');
				trackEvent('missing_3d_data', { reason: 'no_ion_token' });
				return;
			}
			try {
				const worldTerrain = Cesium.Terrain.fromWorldTerrain();
				worldTerrain.readyEvent.addEventListener(() => {
					if (!disposed) setTerrainReady(true);
				});
				viewer.scene.setTerrain(worldTerrain);
				const buildings = await Cesium.createOsmBuildingsAsync();
				if (!disposed) {
					viewer.scene.primitives.add(buildings);
					callbacksRef.current.onDataQuality('full');
				}
			} catch {
				if (!disposed) {
					callbacksRef.current.onDataQuality('degraded');
					trackEvent('quota_degradation', { source: 'cesium_ion' });
				}
			}
		})();

		// Klick setzt den Marker neu (FR2 in 3D)
		const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
		handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
			const cartesian = viewer.scene.pickPosition(event.position);
			const picked =
				cartesian ?? viewer.camera.pickEllipsoid(event.position, viewer.scene.globe.ellipsoid);
			if (!picked) return;
			const carto = Cesium.Cartographic.fromCartesian(picked);
			callbacksRef.current.onMarkerChange({
				lat: Cesium.Math.toDegrees(carto.latitude),
				lon: Cesium.Math.toDegrees(carto.longitude),
			});
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

		setReady(true);
		return () => {
			disposed = true;
			handler.destroy();
			viewer.destroy();
			viewerRef.current = null;
			fanPrimitivesRef.current = null;
			markerEntityRef.current = null;
		};
	}, []);

	// Kamera beim ersten Marker ausrichten (Übersetzung aus 2D, FR9)
	useEffect(() => {
		const viewer = viewerRef.current;
		if (!viewer || !ready || !marker) return;
		const height = zoomToHeight(zoom2d);
		const aim = (groundHeight: number) => {
			viewer.camera.lookAt(
				Cesium.Cartesian3.fromDegrees(marker.lon, marker.lat, groundHeight),
				new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-40), height),
			);
			viewer.camera.lookAtTransform(Cesium.Matrix4.IDENTITY);
			viewer.scene.requestRender();
		};
		aim(0);
		const terrain = viewer.terrainProvider;
		if (terrain && !(terrain instanceof Cesium.EllipsoidTerrainProvider)) {
			// Ziel auf Geländehöhe korrigieren, sobald Terrain-Daten da sind
			void Cesium.sampleTerrainMostDetailed(terrain, [
				Cesium.Cartographic.fromDegrees(marker.lon, marker.lat),
			])
				.then(([pos]) => aim(pos?.height ?? 0))
				.catch(() => undefined);
		}
	}, [ready, terrainReady]);

	// Marker + Fächer synchron halten (FR6: sofortige Aktualisierung)
	useEffect(() => {
		const viewer = viewerRef.current;
		if (!viewer || !ready) return;

		if (markerEntityRef.current) {
			viewer.entities.remove(markerEntityRef.current);
			markerEntityRef.current = null;
		}
		if (fanPrimitivesRef.current) {
			viewer.scene.primitives.remove(fanPrimitivesRef.current);
			fanPrimitivesRef.current = null;
		}
		if (!marker || !path) {
			viewer.scene.requestRender();
			return;
		}

		// Fächer-Ursprung auf Geländehöhe heben (sonst liegt er im Terrain)
		let cancelled = false;
		const build = (groundHeight: number) => {
			if (cancelled) return;
			buildFanAndMarker(groundHeight);
		};
		const terrain = viewer.terrainProvider;
		if (terrain && !(terrain instanceof Cesium.EllipsoidTerrainProvider)) {
			void Cesium.sampleTerrainMostDetailed(terrain, [
				Cesium.Cartographic.fromDegrees(marker.lon, marker.lat),
			])
				.then(([pos]) => build((pos?.height ?? 0) + 2))
				.catch(() => build(2));
		} else {
			build(2);
		}

		 
		function buildFanAndMarker(groundHeight: number) {
		if (!viewer || !marker || !path) return;
		// Marker (snap-to-ground via clamped Point)
		markerEntityRef.current = viewer.entities.add({
			position: Cesium.Cartesian3.fromDegrees(marker.lon, marker.lat),
			point: {
				pixelSize: 12,
				color: Cesium.Color.fromCssColorString('#c9a24a'),
				outlineColor: Cesium.Color.fromCssColorString('#0e1c2a'),
				outlineWidth: 2,
				heightReference: Cesium.HeightReference.CLAMP_TO_GROUND,
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
			},
		});

		// Fächer: Vektoren mit echter Elevation (Story 4.3)
		const primitives = new Cesium.PrimitiveCollection();
		const polylines = new Cesium.PolylineCollection();
		const labels = new Cesium.LabelCollection();
		const origin = Cesium.Cartesian3.fromDegrees(marker.lon, marker.lat, groundHeight);
		const enu = Cesium.Transforms.eastNorthUpToFixedFrame(origin);

		const gold = Cesium.Color.fromCssColorString('#c9a24a');
		const teal = Cesium.Color.fromCssColorString('#4ca2a8');

		const addVector = (azimuthDeg: number, altitudeDeg: number, text: string, isEvent: boolean) => {
			const az = Cesium.Math.toRadians(azimuthDeg);
			const alt = Cesium.Math.toRadians(Math.max(altitudeDeg, 0));
			const local = new Cesium.Cartesian3(
				Math.sin(az) * Math.cos(alt) * FAN_LENGTH_METERS,
				Math.cos(az) * Math.cos(alt) * FAN_LENGTH_METERS,
				Math.sin(alt) * FAN_LENGTH_METERS,
			);
			const end = Cesium.Matrix4.multiplyByPoint(enu, local, new Cesium.Cartesian3());
			polylines.add({
				positions: [origin, end],
				width: isEvent ? 3 : 2,
				material: Cesium.Material.fromType('Color', {
					color: isEvent ? teal : gold,
				}),
			});
			labels.add({
				position: end,
				text,
				font: `${isEvent ? '600 13px' : '500 13px'} system-ui`,
				fillColor: isEvent ? teal : gold,
				outlineColor: Cesium.Color.fromCssColorString('#0e1c2a'),
				outlineWidth: 3,
				style: Cesium.LabelStyle.FILL_AND_OUTLINE,
				pixelOffset: new Cesium.Cartesian2(0, -12),
				disableDepthTestDistance: Number.POSITIVE_INFINITY,
			});
		};

		for (const h of path.hours) {
			if (h.altitudeRefractedDeg <= 0) continue;
			addVector(h.azimuthDeg, h.altitudeTrueDeg, String(h.localHour), false);
		}
		// Auf-/Untergang entlang des Horizonts
		const eventAzimuth = (dec: number | null): number | null => {
			if (dec === null) return null;
			// nächste Stunde als Näherung für den Offset; Azimut exakt via Engine wäre
			// identisch zur 2D-Logik — hier reicht die Stunde davor/danach nicht,
			// deshalb interpolieren wir linear zwischen den Nachbarstunden.
			const before = path.hours[Math.max(0, Math.floor(dec))];
			const after = path.hours[Math.min(23, Math.ceil(dec))];
			if (!before || !after) return null;
			const f = dec - Math.floor(dec);
			const a1 = before.azimuthDeg;
			let a2 = after.azimuthDeg;
			if (Math.abs(a2 - a1) > 180) a2 += a2 < a1 ? 360 : -360;
			return (a1 + (a2 - a1) * f + 360) % 360;
		};
		const riseAz = eventAzimuth(path.sunRiseHours);
		const setAz = eventAzimuth(path.sunSetHours);
		if (riseAz !== null) addVector(riseAz, 0, '↑', true);
		if (setAz !== null) addVector(setAz, 0, '↓', true);

		primitives.add(polylines);
		primitives.add(labels);
		viewer.scene.primitives.add(primitives);
		fanPrimitivesRef.current = primitives;
		viewer.scene.requestRender();
		}

		return () => {
			cancelled = true;
		};
	}, [marker, path, ready, terrainReady]);

	return (
		<div className="absolute inset-0">
			<div ref={containerRef} className="h-full w-full" data-testid="cesium-canvas" />
		</div>
	);
}
