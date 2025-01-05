export type MessageIndexFunction<T extends string> = (
	params: Record<string, never>,
	options: { languageTag: T }
) => string;

export type MessageFunction = (params?: Record<string, never>) => string;

export { paraglideVitePlugin } from "./bundler-plugins/vite.js";
export { paraglideRollupPlugin } from "./bundler-plugins/rollup.js";
