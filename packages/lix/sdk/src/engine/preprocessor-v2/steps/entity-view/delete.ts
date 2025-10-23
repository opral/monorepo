import type { PreprocessorStep } from "../../types.js";

/**
 * Placeholder transformer for entity-view DELETE operations.
 *
 * The eventual implementation will rewrite deletes to cooperate with the
 * hoisted state CTE. Until then we return the node untouched to avoid
 * behavioural changes.
 *
 * @example
 * ```ts
 * const rewritten = rewriteEntityViewDelete({
 *   node: operationNode,
 *   storedSchemas,
 *   cacheTables,
 * });
 * ```
 */
export const rewriteEntityViewDelete: PreprocessorStep = (context) => {
	return context.node;
};
