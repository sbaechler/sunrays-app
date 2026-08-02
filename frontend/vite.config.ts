import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin';
import { reactRouter } from '@react-router/dev/vite';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';
import { cloudflare } from "@cloudflare/vite-plugin";


// `.env` lives at the monorepo root, not inside this workspace.
const envDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

export default defineConfig(({ mode }) => ({
	envDir,
	define: {
		// Cesium lädt Worker/Assets relativ zu dieser Basis (aus public/cesium)
		CESIUM_BASE_URL: JSON.stringify('/cesium'),
	},
	plugins: [
		lingui(),
		// Kompiliert die Lingui-Macros (t, <Trans>, msg); reactRouter() bietet keinen Babel-Hook
		babel({
			include: /app\/.*\.[jt]sx?$/,
			babelConfig: {
				presets: [
					['@babel/preset-typescript', { isTSX: true, allExtensions: true }],
					linguiTransformerBabelPreset().preset,
				],
			},
		}),
		reactRouter(),
		tailwindcss(),
		cloudflare({ configPath: '../wrangler.jsonc' }),
	],
	resolve: {
		preserveSymlinks: false,
		tsconfigPaths: true,
	},
	optimizeDeps: {
		exclude: mode === 'development' ? ['@repo/ui', '@repo/api', '@repo/solar'] : [],
	},
	server: {
		watch: {
			followSymlinks: true, // Vite beobachtet auch verlinkte Dependencies
		},
	},
}));
