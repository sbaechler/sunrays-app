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
 * Elevation = tatsächlicher Sonnenstand. Klick setzt den Marker neu (FR2),
 * Drag auf dem Marker verschiebt ihn (Kamera-Inputs währenddessen pausiert).
 *
 * Vertikaler Versatz: ⌘+Drag auf dem Marker hebt/senkt ihn (z. B. aufs Dach);
 * eine dünne Lotlinie visualisiert die Höhe über Grund. ⌘+Doppelklick setzt
 * ihn auf Geländehöhe zurück. ⌘ statt Ctrl, weil Cesium Ctrl für die Kamera
 * belegt (Cesiums KeyboardEventModifier kennt kein Meta — daher eigenes
 * Tracking über keydown/keyup).
 */
import type { MarkerPosition } from '#/Map/state';
import { trackEvent } from '#/Settings/telemetry';
import type { SunPath } from '@repo/solar';
import * as Cesium from 'cesium';
import 'cesium/Build/Cesium/Widgets/widgets.css';
import { useEffect, useRef, useState } from 'react';

const FAN_LENGTH_METERS = 250;
/** Grenzen für den vertikalen Marker-Versatz (⌘+Drag) in Metern. */
const MAX_HEIGHT_OFFSET = 1000;
/** Unterhalb dieser Höhe schnappt der Marker zurück auf den Boden. */
const SNAP_TO_GROUND_METERS = 0.5;

export interface CesiumViewProps {
	marker: MarkerPosition | null;
	path: SunPath | null;
	/** 2D-Zoom, damit die Kamera-Höhe beim Wechsel ungefähr passt (FR9). */
	zoom2d: number | null;
	onMarkerChange: (marker: MarkerPosition) => void;
	/** FR10: keine hochwertigen 3D-Daten verfügbar (Token fehlt / Fehler). */
	onDataQuality: (quality: 'full' | 'degraded') => void;
	/** Liefert den Viewer nach der Initialisierung (für den PNG-Export). */
	onViewerReady?: (viewer: Cesium.Viewer | null) => void;
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
	onViewerReady,
}: CesiumViewProps) {
	const containerRef = useRef<HTMLDivElement>(null);
	const viewerRef = useRef<Cesium.Viewer | null>(null);
	const fanPrimitivesRef = useRef<Cesium.PrimitiveCollection | null>(null);
	const markerEntityRef = useRef<Cesium.Entity | null>(null);
	const heightLineEntityRef = useRef<Cesium.Entity | null>(null);
	/** Zuletzt gesampelte Geländehöhe am Marker (für den vertikalen Drag). */
	const groundHeightRef = useRef(0);
	const markerRef = useRef(marker);
	markerRef.current = marker;
	/**
	 * Zuletzt aus der 3D-Ansicht selbst gemeldete Position (Klick/Drag).
	 * Kommt dieselbe Position als Prop zurück, bewegt sich die Kamera nicht —
	 * nur externe Änderungen (Suche, Geolocation) lösen einen Kameraflug aus.
	 */
	const internalPosRef = useRef<MarkerPosition | null>(null);
	/** false, bis die Kamera zum ersten Mal auf einen Marker ausgerichtet wurde. */
	const hasAimedRef = useRef(false);
	const callbacksRef = useRef({ onMarkerChange, onDataQuality, onViewerReady });
	callbacksRef.current = { onMarkerChange, onDataQuality, onViewerReady };
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
			// PNG-Export (FR11): Buffer muss nach dem Rendern lesbar bleiben
			contextOptions: { webgl: { preserveDrawingBuffer: true } },
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

		// Position unter dem Cursor bestimmen (Terrain/Gebäude, sonst Ellipsoid)
		const pickGround = (position: Cesium.Cartesian2): MarkerPosition | null => {
			const cartesian =
				viewer.scene.pickPosition(position) ??
				viewer.camera.pickEllipsoid(position, viewer.scene.globe.ellipsoid);
			if (!cartesian) return null;
			const carto = Cesium.Cartographic.fromCartesian(cartesian);
			return {
				lat: Cesium.Math.toDegrees(carto.latitude),
				lon: Cesium.Math.toDegrees(carto.longitude),
			};
		};
		const picksMarker = (position: Cesium.Cartesian2): boolean => {
			if (!markerEntityRef.current) return false;
			const picked = viewer.scene.pick(position) as { id?: unknown } | undefined;
			return picked?.id === markerEntityRef.current;
		};

		// ⌘-Status selbst verfolgen: Cesiums KeyboardEventModifier kennt nur
		// Shift/Ctrl/Alt, Meta löst deshalb die unmodifizierten Handler aus.
		let metaDown = false;
		const onMetaKey = (e: KeyboardEvent) => {
			if (e.key === 'Meta') metaDown = e.type === 'keydown';
		};
		const onWindowBlur = () => {
			metaDown = false;
		};
		window.addEventListener('keydown', onMetaKey);
		window.addEventListener('keyup', onMetaKey);
		window.addEventListener('blur', onWindowBlur);

		// Aktuelle Marker-Weltposition (inkl. vertikalem Versatz)
		const markerWorldPosition = (): Cesium.Cartesian3 | null => {
			const m = markerRef.current;
			if (!m) return null;
			return Cesium.Cartesian3.fromDegrees(
				m.lon,
				m.lat,
				groundHeightRef.current + (m.heightOffset ?? 0),
			);
		};

		// Marker-Änderung aus der 3D-Interaktion melden: die Position wird
		// vermerkt, damit der Kamera-Effekt sie nicht als externe Änderung
		// (Suche/Geolocation) interpretiert und die Kamera verschiebt.
		const reportMarker = (pos: MarkerPosition) => {
			internalPosRef.current = pos;
			callbacksRef.current.onMarkerChange(pos);
		};

		// Klick setzt den Marker neu (FR2 in 3D); mit ⌘ ist der Klick für den
		// vertikalen Modus reserviert und verschiebt nichts.
		const handler = new Cesium.ScreenSpaceEventHandler(viewer.scene.canvas);
		handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
			if (metaDown) return;
			const pos = pickGround(event.position);
			if (pos) reportMarker(pos);
		}, Cesium.ScreenSpaceEventType.LEFT_CLICK);

		// Drag & Drop des Markers (Follow-up zu Story 4.2): Während des Drags
		// folgt nur die Marker-Entity dem Cursor; der Fächer wird — wie in 2D —
		// erst beim Loslassen neu berechnet. Mit gehaltenem ⌘ wird stattdessen
		// vertikal gezogen (Höhe über Grund).
		let dragging = false;
		let verticalDrag: { startY: number; startOffset: number; metersPerPixel: number } | null =
			null;
		let verticalDragOffset = 0;

		const applyVerticalOffset = (offset: number) => {
			const m = markerRef.current;
			const entity = markerEntityRef.current;
			if (!m || !entity) return;
			verticalDragOffset = offset;
			const ground = groundHeightRef.current;
			const top = Cesium.Cartesian3.fromDegrees(m.lon, m.lat, ground + offset);
			entity.position = new Cesium.ConstantPositionProperty(top);
			if (entity.point) {
				entity.point.heightReference = new Cesium.ConstantProperty(
					offset > 0 ? Cesium.HeightReference.NONE : Cesium.HeightReference.CLAMP_TO_GROUND,
				);
			}
			const line = heightLineEntityRef.current;
			if (line) {
				line.show = offset > 0;
				if (line.polyline) {
					line.polyline.positions = new Cesium.ConstantProperty([
						Cesium.Cartesian3.fromDegrees(m.lon, m.lat, ground),
						top,
					]);
				}
			}
			viewer.scene.requestRender();
		};

		handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
			if (!picksMarker(event.position)) return;
			viewer.scene.screenSpaceCameraController.enableInputs = false;
			if (metaDown) {
				// Pixel→Meter am Marker: Frustum-Höhe in Marker-Distanz / Canvas-Höhe
				const world = markerWorldPosition();
				const frustum = viewer.camera.frustum;
				const fovy =
					frustum instanceof Cesium.PerspectiveFrustum ? (frustum.fovy ?? 1) : 1;
				const distance = world
					? Cesium.Cartesian3.distance(viewer.camera.position, world)
					: 1000;
				verticalDrag = {
					startY: event.position.y,
					startOffset: markerRef.current?.heightOffset ?? 0,
					metersPerPixel:
						(2 * distance * Math.tan(fovy / 2)) / Math.max(1, viewer.canvas.clientHeight),
				};
				verticalDragOffset = verticalDrag.startOffset;
				viewer.canvas.style.cursor = 'ns-resize';
				return;
			}
			dragging = true;
			viewer.canvas.style.cursor = 'grabbing';
		}, Cesium.ScreenSpaceEventType.LEFT_DOWN);
		handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.MotionEvent) => {
			if (verticalDrag) {
				const raw =
					verticalDrag.startOffset +
					(verticalDrag.startY - event.endPosition.y) * verticalDrag.metersPerPixel;
				const offset =
					raw < SNAP_TO_GROUND_METERS ? 0 : Math.min(raw, MAX_HEIGHT_OFFSET);
				applyVerticalOffset(offset);
				return;
			}
			if (dragging) {
				const pos = pickGround(event.endPosition);
				if (pos && markerEntityRef.current) {
					// Höhe über Grund näherungsweise beibehalten; die exakte
					// Geländehöhe wird beim Loslassen neu gesampelt.
					const offset = markerRef.current?.heightOffset ?? 0;
					markerEntityRef.current.position = new Cesium.ConstantPositionProperty(
						offset > 0
							? Cesium.Cartesian3.fromDegrees(
									pos.lon,
									pos.lat,
									groundHeightRef.current + offset,
								)
							: Cesium.Cartesian3.fromDegrees(pos.lon, pos.lat),
					);
					viewer.scene.requestRender();
				}
				return;
			}
			// Hover-Affordance: Greif-Cursor über dem Marker
			viewer.canvas.style.cursor = picksMarker(event.endPosition) ? 'grab' : '';
		}, Cesium.ScreenSpaceEventType.MOUSE_MOVE);
		handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
			if (verticalDrag) {
				const changed = verticalDragOffset !== verticalDrag.startOffset;
				verticalDrag = null;
				viewer.scene.screenSpaceCameraController.enableInputs = true;
				viewer.canvas.style.cursor = '';
				const m = markerRef.current;
				// Unverändert (z. B. ⌘+Klick ohne Bewegung): nichts committen,
				// sonst zerstört der Rebuild die Entity vor einem ⌘+Doppelklick.
				if (m && changed) {
					reportMarker({
						lat: m.lat,
						lon: m.lon,
						...(verticalDragOffset > 0
							? { heightOffset: Math.round(verticalDragOffset * 10) / 10 }
							: {}),
					});
				}
				return;
			}
			if (!dragging) return;
			dragging = false;
			viewer.scene.screenSpaceCameraController.enableInputs = true;
			viewer.canvas.style.cursor = '';
			const pos = pickGround(event.position);
			if (pos) {
				const offset = markerRef.current?.heightOffset;
				reportMarker(offset && offset > 0 ? { ...pos, heightOffset: offset } : pos);
			}
		}, Cesium.ScreenSpaceEventType.LEFT_UP);

		// ⌘+Doppelklick auf den Marker: zurück auf Geländehöhe
		handler.setInputAction((event: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
			if (!metaDown) return;
			const m = markerRef.current;
			if (!m?.heightOffset || !picksMarker(event.position)) return;
			reportMarker({ lat: m.lat, lon: m.lon });
		}, Cesium.ScreenSpaceEventType.LEFT_DOUBLE_CLICK);

		setReady(true);
		callbacksRef.current.onViewerReady?.(viewer);
		return () => {
			disposed = true;
			window.removeEventListener('keydown', onMetaKey);
			window.removeEventListener('keyup', onMetaKey);
			window.removeEventListener('blur', onWindowBlur);
			callbacksRef.current.onViewerReady?.(null);
			handler.destroy();
			viewer.destroy();
			viewerRef.current = null;
			fanPrimitivesRef.current = null;
			markerEntityRef.current = null;
			heightLineEntityRef.current = null;
		};
	}, []);

	// Kamera auf den Marker ausrichten (Übersetzung aus 2D, FR9). Läuft beim
	// ersten Marker (auch wenn er erst nach der Initialisierung gesetzt wird)
	// und bei externen Ortswechseln (Suche/Geolocation) — Klick/Drag in der
	// 3D-Ansicht selbst bewegt die Kamera nicht (siehe internalPosRef).
	useEffect(() => {
		const viewer = viewerRef.current;
		if (!viewer || !ready || !marker) return;
		const internal = internalPosRef.current;
		internalPosRef.current = null;
		const isInternal =
			internal !== null &&
			internal.lat === marker.lat &&
			internal.lon === marker.lon &&
			(internal.heightOffset ?? 0) === (marker.heightOffset ?? 0);
		if (isInternal && hasAimedRef.current) return;
		const firstAim = !hasAimedRef.current;
		hasAimedRef.current = true;

		let cancelled = false;
		const height = zoomToHeight(zoom2d);
		const aim = (groundHeight: number) => {
			if (cancelled) return;
			viewer.camera.flyToBoundingSphere(
				new Cesium.BoundingSphere(
					Cesium.Cartesian3.fromDegrees(marker.lon, marker.lat, groundHeight),
					1,
				),
				{
					offset: new Cesium.HeadingPitchRange(0, Cesium.Math.toRadians(-40), height),
					duration: firstAim ? 0 : 1.2,
				},
			);
			viewer.scene.requestRender();
		};
		const terrain = viewer.terrainProvider;
		const hasTerrain = terrain && !(terrain instanceof Cesium.EllipsoidTerrainProvider);
		// Initial sofort grob ausrichten (kein leerer Frame); animierte Flüge
		// warten auf die Geländehöhe, damit der Flug nicht neu startet.
		if (firstAim || !hasTerrain) aim(0);
		if (hasTerrain) {
			void Cesium.sampleTerrainMostDetailed(terrain, [
				Cesium.Cartographic.fromDegrees(marker.lon, marker.lat),
			])
				.then(([pos]) => aim(pos?.height ?? 0))
				.catch(() => {
					if (!firstAim) aim(0);
				});
		}
		return () => {
			cancelled = true;
		};
	}, [ready, terrainReady, marker?.lat, marker?.lon, marker?.heightOffset]);

	// Marker + Fächer synchron halten (FR6: sofortige Aktualisierung)
	useEffect(() => {
		const viewer = viewerRef.current;
		if (!viewer || !ready) return;

		if (markerEntityRef.current) {
			viewer.entities.remove(markerEntityRef.current);
			markerEntityRef.current = null;
		}
		if (heightLineEntityRef.current) {
			viewer.entities.remove(heightLineEntityRef.current);
			heightLineEntityRef.current = null;
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
			groundHeightRef.current = groundHeight;
			buildFanAndMarker(groundHeight);
		};
		const terrain = viewer.terrainProvider;
		if (terrain && !(terrain instanceof Cesium.EllipsoidTerrainProvider)) {
			void Cesium.sampleTerrainMostDetailed(terrain, [
				Cesium.Cartographic.fromDegrees(marker.lon, marker.lat),
			])
				.then(([pos]) => build(pos?.height ?? 0))
				.catch(() => build(0));
		} else {
			build(0);
		}

		function buildFanAndMarker(groundHeight: number) {
			if (!viewer || !marker || !path) return;
			const heightOffset = marker.heightOffset ?? 0;
			const gold = Cesium.Color.fromCssColorString('#c9a24a');
			const teal = Cesium.Color.fromCssColorString('#4ca2a8');

			// Marker: auf dem Boden geklemmt, mit vertikalem Versatz absolut
			markerEntityRef.current = viewer.entities.add({
				position:
					heightOffset > 0
						? Cesium.Cartesian3.fromDegrees(
								marker.lon,
								marker.lat,
								groundHeight + heightOffset,
							)
						: Cesium.Cartesian3.fromDegrees(marker.lon, marker.lat),
				point: {
					pixelSize: 12,
					color: gold,
					outlineColor: Cesium.Color.fromCssColorString('#0e1c2a'),
					outlineWidth: 2,
					heightReference:
						heightOffset > 0
							? Cesium.HeightReference.NONE
							: Cesium.HeightReference.CLAMP_TO_GROUND,
					disableDepthTestDistance: Number.POSITIVE_INFINITY,
				},
			});

			// Lotlinie Marker→Boden: macht die Höhe über Grund ablesbar
			heightLineEntityRef.current = viewer.entities.add({
				show: heightOffset > 0,
				polyline: {
					positions: [
						Cesium.Cartesian3.fromDegrees(marker.lon, marker.lat, groundHeight),
						Cesium.Cartesian3.fromDegrees(marker.lon, marker.lat, groundHeight + heightOffset),
					],
					width: 1.5,
					material: new Cesium.PolylineDashMaterialProperty({
						color: gold.withAlpha(0.85),
						dashLength: 10,
					}),
				},
			});

			// Fächer: Vektoren mit echter Elevation (Story 4.3); Ursprung folgt
			// dem vertikalen Versatz (Sicht z. B. vom Dach aus)
			const primitives = new Cesium.PrimitiveCollection();
			const polylines = new Cesium.PolylineCollection();
			const labels = new Cesium.LabelCollection();
			const origin = Cesium.Cartesian3.fromDegrees(
				marker.lon,
				marker.lat,
				groundHeight + heightOffset + 2,
			);
			const enu = Cesium.Transforms.eastNorthUpToFixedFrame(origin);

			const addVector = (
				azimuthDeg: number,
				altitudeDeg: number,
				text: string,
				isEvent: boolean,
			) => {
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
