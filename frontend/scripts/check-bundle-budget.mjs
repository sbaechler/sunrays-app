/**
 * Bundle-Budget (QS, NFR Performance): schlägt fehl, wenn der initiale
 * JS-Payload wächst. Cesium ist lazy (eigener Chunk) und hat ein eigenes,
 * grosszügigeres Budget. Budgets = Ist-Stand + ~25 % Headroom; bewusst
 * einfach gehalten (gzip über build/client/assets).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const ASSETS_DIR = new URL('../build/client/assets', import.meta.url).pathname;

const BUDGETS_KB = {
	initial: 500, // alle JS-Chunks ausser Cesium (App, React, MapLibre, Solar)
	cesium: 1600, // lazy geladener 3D-Chunk
	css: 90,
};

const sizes = { initial: 0, cesium: 0, css: 0 };
for (const file of readdirSync(ASSETS_DIR)) {
	const gzipped = gzipSync(readFileSync(join(ASSETS_DIR, file))).length / 1024;
	if (file.endsWith('.css')) sizes.css += gzipped;
	else if (file.endsWith('.js'))
		sizes[file.startsWith('CesiumView') ? 'cesium' : 'initial'] += gzipped;
}

let failed = false;
for (const [key, budget] of Object.entries(BUDGETS_KB)) {
	const actual = Math.round(sizes[key]);
	const ok = actual <= budget;
	if (!ok) failed = true;
	console.log(`${ok ? 'OK  ' : 'FAIL'} ${key.padEnd(8)} ${actual} KB gzip (Budget ${budget} KB)`);
}

if (failed) {
	console.error('\nBundle-Budget überschritten — Budget bewusst anheben oder Payload reduzieren.');
	process.exit(1);
}
