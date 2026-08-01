// Cesiums vorgebaute Bundles ermitteln das globale Objekt via (0,eval)("this"),
// was unsere CSP ohne 'unsafe-eval' verletzt. globalThis ist in allen
// unterstützten Browsern äquivalent. Läuft als postinstall (idempotent).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cesiumBuild = join(root, 'node_modules', 'cesium', 'Build', 'Cesium');
const files = [
	join(cesiumBuild, 'Cesium.js'),
	join(cesiumBuild, 'index.js'),
	join(cesiumBuild, 'index.cjs'),
	// Knockout (via Cesium Widgets) nutzt denselben eval-Shim und landet
	// über den Vite-Build im App-Bundle.
	join(root, 'node_modules', '@cesium', 'widgets', 'Source', 'ThirdParty', 'knockout-3.5.1.js'),
];
const pattern = /\(0,\s*eval\)\("this"\)/g;

for (const path of files) {
	if (!existsSync(path)) {
		console.warn(`patch-cesium-csp: ${path} nicht gefunden, übersprungen`);
		continue;
	}
	const source = readFileSync(path, 'utf8');
	const patched = source.replace(pattern, 'globalThis');
	if (patched === source) continue;
	writeFileSync(path, patched);
	console.log(`patch-cesium-csp: eval-Shim in ${path} ersetzt`);
}
