/**
 * The Package version from package.json
 *
 * This value is inlined by vite during build to avoid having to read the package.json
 * at runtime
 */
declare const PARJS_PACKAGE_VERSION: string;

/**
 * The PUBLIC_POSTHOG_TOKEN defined in the build step
 */
declare const PARJS_POSTHOG_TOKEN: string;

/**
 * The id configured in the marketplace manifest
 */
declare const PARJS_MARKTEPLACE_ID: string;
