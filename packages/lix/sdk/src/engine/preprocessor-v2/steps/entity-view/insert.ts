import type { PreprocessorStep } from "../../types.js";

/**
 * Placeholder transformer for entity-view INSERT operations.
 *
 * The real implementation will rewrite inserts to target the hoisted
 * rewrite CTE and adjust metadata writes. For now we simply return the
 * original node so existing behaviour remains intact.
 *
 * @example
 * ```ts
 * const rewritten = rewriteEntityViewInsert({
 *   node: operationNode,
 *   storedSchemas,
 *   cacheTables,
 * });
 * ```
 */
export const rewriteEntityViewInsert: PreprocessorStep = (context) => {
	return context.node;
};
