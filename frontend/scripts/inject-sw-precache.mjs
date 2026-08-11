/**
 * After `react-router build`, inject hashed i18n catalog chunk URLs into the
 * copied service worker so every locale is precached for offline use.
 *
 * Source: public/sw.js (placeholders CACHE=sunrays-shell-dev, PRECACHE_EXTRA=[]).
 * Output: build/client/sw.js
 */
import { createHash } from 'node:crypto';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDir = path.resolve(__dirname, '../build/client');
const assetsDir = path.join(clientDir, 'assets');
const swPath = path.join(clientDir, 'sw.js');

const assetNames = await readdir(assetsDir);
const messageUrls = assetNames
	.filter(name => /^messages-[\w-]+\.js$/.test(name))
	.sort()
	.map(name => `/assets/${name}`);

if (messageUrls.length === 0) {
	console.error(
		'inject-sw-precache: no messages-*.js chunks found in build/client/assets — did the build run?',
	);
	process.exit(1);
}

// Content-hash keeps SW cache name stable across rebuilds with identical catalogs,
// and forces a fresh cache when any catalog chunk changes.
const version = createHash('sha256').update(messageUrls.join('\n')).digest('hex').slice(0, 10);
const cacheName = `sunrays-shell-${version}`;

let sw = await readFile(swPath, 'utf8');

if (!sw.includes("const CACHE = 'sunrays-shell-dev'") || !sw.includes('const PRECACHE_EXTRA = []')) {
	console.error(
		'inject-sw-precache: sw.js markers missing (expected CACHE = sunrays-shell-dev and PRECACHE_EXTRA = []).',
	);
	process.exit(1);
}

sw = sw
	.replace("const CACHE = 'sunrays-shell-dev'", `const CACHE = '${cacheName}'`)
	.replace('const PRECACHE_EXTRA = []', `const PRECACHE_EXTRA = ${JSON.stringify(messageUrls)}`);

await writeFile(swPath, sw);

console.log(
	`inject-sw-precache: ${cacheName} (+${messageUrls.length} locale chunks)\n` +
		messageUrls.map(u => `  ${u}`).join('\n'),
);
