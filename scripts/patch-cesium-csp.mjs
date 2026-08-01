// Cesiums vorgebaute Bundles ermitteln das globale Objekt via (0,eval)("this"),
// was unsere CSP ohne 'unsafe-eval' verletzt. globalThis ist in allen
// unterstützten Browsern äquivalent. Läuft als postinstall (idempotent).
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const cesiumBuild = join(root, 'node_modules', 'cesium', 'Build', 'Cesium');
const files = ['Cesium.js', 'index.js', 'index.cjs'];
const pattern = /\(0,\s*eval\)\("this"\)/g;

for (const name of files) {
	const path = join(cesiumBuild, name);
	if (!existsSync(path)) {
		console.warn(`patch-cesium-csp: ${name} nicht gefunden, übersprungen`);
		continue;
	}
	const source = readFileSync(path, 'utf8');
	if (!pattern.test(source)) continue;
	writeFileSync(path, source.replace(pattern, 'globalThis'));
	console.log(`patch-cesium-csp: eval-Shim in ${name} ersetzt`);
}
