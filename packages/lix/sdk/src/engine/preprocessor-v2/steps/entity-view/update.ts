import type { PreprocessorStep } from "../../types.js";

/**
 * Placeholder transformer for entity-view UPDATE operations.
 *
 * Once implemented, this will ensure updates cooperate with the rewritten
 * state pipeline, including metadata propagation. Returning the node
 * unchanged keeps today’s semantics while we stage the structure.
 *
 * @example
 * ```ts
 * const rewritten = rewriteEntityViewUpdate({
 *   node: operationNode,
 *   storedSchemas,
 *   cacheTables,
 * });
 * ```
 */
export const rewriteEntityViewUpdate: PreprocessorStep = (context) => {
	return context.node;
};
