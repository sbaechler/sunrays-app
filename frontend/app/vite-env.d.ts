/// <reference types="vite/client" />

declare module '*.po' {
	import type { Messages } from '@lingui/core';
	export const messages: Messages;
}

interface ImportMetaEnv {
	readonly VITE_BUILD_NUMBER: string;
	readonly VITE_VERSION: string;
	// more env variables...
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}
