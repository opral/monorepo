import type { PreprocessorContext, PreprocessorStep } from "./types.js";
import type { StatementNode } from "./sql-parser/nodes.js";

const pipeline: PreprocessorStep[] = [];

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
