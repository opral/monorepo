/**
 * Internal re-export of Kysely used by Lix tooling.
 *
 * This surface is considered implementation detail: it exists so that
 * packages such as `@lix-js/react-utils` can share the same Kysely
 * dependency as the SDK without each declaring its own version.
 */
export * from "kysely";
