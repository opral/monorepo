import type { StatementNode } from "./sql-parser/nodes.js";
import { rewriteVtableSelects } from "./steps/rewrite-vtable-selects.js";
import { rewriteStateAllViewSelect } from "./steps/state-all-view/select.js";
import { rewriteEntityViewSelect } from "./steps/entity-view/select.js";
import { rewriteStateViewSelect } from "./steps/state-view/select.js";
import type { PreprocessorContext, PreprocessorStep } from "./types.js";

const pipeline: PreprocessorStep[] = [
    rewriteEntityViewSelect,
    rewriteStateViewSelect,
    rewriteStateAllViewSelect,
    rewriteVtableSelects,
];

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
