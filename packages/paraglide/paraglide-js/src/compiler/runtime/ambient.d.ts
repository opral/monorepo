/**
 * Declared globablly to write the runtime functions.
 */
export declare global {
	/**
	 * Locale used by the variable strategy.
	 */
	let _locale: string;
	let isServer: boolean;
	// string because precise locale is unknown before compilation
	type Locale = any;
}
