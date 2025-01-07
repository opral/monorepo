/**
 * Avoiding TypeScript errors before the `createIndexFile` script
 * is invoked by defining the type ahead of time.
 */

/**
 * Env variables that are available at runtime.
 */
export declare const ENV_VARIABLES: {
	LIX_SDK_POSTHOG_TOKEN?: string;
	/**
	 * As defined in the package.json
	 */
	LIX_SDK_VERSION?: string;
};
