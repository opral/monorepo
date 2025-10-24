import type { StatementNode } from "./sql-parser/nodes.js";
import type { PreprocessorContext, PreprocessorStep } from "./types.js";
import { rewriteVtableSelects } from "./steps/rewrite-vtable-selects.js";

const pipeline: PreprocessorStep[] = [rewriteVtableSelects];

/**
 * Executes the v3 preprocessing pipeline on the provided statement AST node.
 *
 * @example
 * ```ts
 * const statement: StatementNode = parse(sql);
 * const rewritten = preprocessStatement(statement, context);
 * ```
 */
export function preprocessStatement(
	node: StatementNode,
	context: PreprocessorContext
): StatementNode {
	return pipeline.reduce<StatementNode>(
		(current, step) =>
			step({
				node: current,
				getStoredSchemas: context.getStoredSchemas,
				getCacheTables: context.getCacheTables,
				hasOpenTransaction: context.hasOpenTransaction,
				trace: context.trace,
			}) as StatementNode,
		node
	);
}
