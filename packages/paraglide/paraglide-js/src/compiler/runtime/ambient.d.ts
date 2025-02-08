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
	let pathToRegexp: {
		match: (path: string) => (pathname: string) => any;
		compile: (path: string) => (params: any) => string;
	};
}
