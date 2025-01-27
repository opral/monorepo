import type { Runtime } from "./type.ts";

/**
 * Declared globablly to write the runtime functions.
 */
declare global {
	/**
	 * Locale used by custom strategy.
	 */
	export let _locale: string;
	export const strategy: any;
	export const baseLocale: Runtime["baseLocale"];
	export const locales: Runtime["locales"];
	export const assertIsLocale: Runtime["assertIsLocale"];
	export const isLocale: Runtime["isLocale"];
	export let getLocale: Runtime["getLocale"];
	export let setLocale: Runtime["setLocale"];
	export const localeInPath: Runtime["localeInPath"];
	// string because precise locale is unknown before compilation
	export type Locale = any;
}
