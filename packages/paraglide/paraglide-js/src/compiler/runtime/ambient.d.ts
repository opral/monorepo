import type { Runtime } from "./type.ts";

/**
 * Declared globablly for testing purposes.
 */
declare global {
	export const isLocale: Runtime["isLocale"];
	export type Locale = any;
}
