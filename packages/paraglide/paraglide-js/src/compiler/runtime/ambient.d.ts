import type { Strategy } from "../strategy.ts";
import type { Runtime } from "./type.ts";

/**
 * Declared globablly to write the runtime functions.
 */
declare global {
	export const strategy: Strategy;
	export const baseLocale: Runtime["baseLocale"];
	export const locales: Runtime["locales"];
	export const assertIsLocale: Runtime["assertIsLocale"];
	export const isLocale: Runtime["isLocale"];
	export const getLocale: Runtime["getLocale"];
	export const localeInPath: Runtime["localeInPath"];
	// string because precise locale is unknown before compilation
	export type Locale = string;
}
