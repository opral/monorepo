/**
 * The Package version from package.json
 *
 * This value is inlined by vite during build to avoid having to read the package.json
 * at runtime
 */
declare const PACKAGE_VERSION: string

/**
 * Additional Environment Variables defined in the build step
 *
 * These may be used by dependencies
 */
declare const ENV_DEFINED_IN_BUILD_STEP: Record<string, string>
