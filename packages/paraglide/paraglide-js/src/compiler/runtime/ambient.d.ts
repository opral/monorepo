import * as ptr from "path-to-regexp";

/**
 * Declared globablly to write the runtime functions.
 */
export declare global {
	/**
	 * Locale used by the variable strategy.
	 */
	let _locale: string;
	// string because precise locale is unknown before compilation
	type Locale = any;
	const pathToRegexp = { match: ptr.match, compile: ptr.compile };
}
