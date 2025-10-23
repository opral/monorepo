import type { PreprocessorStep } from "../../types.js";

/**
 * Rewrites entity view queries to leverage the v2 preprocessor pipeline.
 *
 * The handler inspects the root operation and delegates to the appropriate
 * SELECT/INSERT/UPDATE/DELETE transformer. For now it simply passes the node
 * through unchanged, allowing us to stage future logic without altering
 * behaviour.
 *
 * @example
 * ```ts
 * const node = rewriteEntityView({
 *   node: operationNode,
 *   storedSchemas: new Map(),
 *   cacheTables: new Map(),
 * });
 * ```
 */
export const rewriteEntityView: PreprocessorStep = (context) => {
	return context.node;
};
