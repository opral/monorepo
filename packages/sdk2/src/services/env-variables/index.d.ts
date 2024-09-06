/**
 * Avoiding TypeScript errors before the `createIndexFile` script
 * is invoked by defining the type ahead of time.
 */

/**
 * Env variables that are available at runtime.
 */
export declare const ENV_VARIABLES: {
	PUBLIC_POSTHOG_TOKEN?: string;
	PUBLIC_INLANG_SDK_SENTRY_DSN?: string;
	/**
	 * As defined in the package.json
	 */
	SDK_VERSION: string;
};
