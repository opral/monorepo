import type { Runtime } from "./type.ts";

/**
 * Declared globablly to write the runtime functions.
 */
declare global {
	/**
	 * Locale used by custom strategy.
	 */
	export let _localeVariable: string;
	export const strategy: Array<
		"cookie" | "pathname" | "variable" | "baseLocale" | "custom"
	>;
	export const cookieName: Runtime["cookieName"];
	export const baseLocale: Runtime["baseLocale"];
	export const locales: Runtime["locales"];
	export const assertIsLocale: Runtime["assertIsLocale"];
	export const isLocale: Runtime["isLocale"];
	export let getLocale: Runtime["getLocale"];
	export let setLocale: Runtime["setLocale"];
	export const localeInPath: Runtime["localeInPath"];
	export const localizePath: Runtime["localizePath"];
	// string because precise locale is unknown before compilation
	export type Locale = any;
}
