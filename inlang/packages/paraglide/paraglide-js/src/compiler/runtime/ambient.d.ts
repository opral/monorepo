import type { Runtime } from "./type.ts";

/**
 * Declared globablly for testing purposes.
 */
declare global {
	export const baseLocale: Runtime["baseLocale"];
	export const locales: Runtime["locales"];
	export const isLocale: Runtime["isLocale"];
	export const getLocale: Runtime["getLocale"];
	export const getLocaleFromPath: Runtime["getLocaleFromPath"];
	export type Locale = any;
}
