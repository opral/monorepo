/**
 * Avoiding TypeScript errors before the `createIndexFile` script
 * is invoked by defining the type ahead of time.
 */

/**
 * Env variables that are available at runtime.
 *
 * - assume that each env variable might be undefined (to ease development/contributions)
 */
export declare const ENV_VARIABLES: Partial<{
  PUBLIC_POSTHOG_TOKEN: string;
}>;
