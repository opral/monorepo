import type { PreprocessorContext, PreprocessorStep } from "./types.js";
import type { SqlNode } from "./sql-parser/nodes.js";

const pipeline: PreprocessorStep[] = [];

/**
 * Executes the v3 preprocessing pipeline on the provided root AST node.
 *
 * @example
 * ```ts
 * const rewritten = preprocessRootNode(node, context);
 * ```
 */
export function preprocessRootNode(
	node: SqlNode,
	context: PreprocessorContext
): SqlNode {
	return pipeline.reduce<SqlNode>(
		(current, step) =>
			step({
				node: current,
				getStoredSchemas: context.getStoredSchemas,
				getCacheTables: context.getCacheTables,
				hasOpenTransaction: context.hasOpenTransaction,
				trace: context.trace,
			}),
		node
	);
}
