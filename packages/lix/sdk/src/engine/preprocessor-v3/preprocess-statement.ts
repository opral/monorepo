import type { StatementNode } from "./sql-parser/nodes.js";
import { expandSqlViews } from "./steps/expand-sql-views.js";
import { rewriteVtableSelects } from "./steps/rewrite-vtable-selects.js";
import { rewriteStateAllViewSelect } from "./steps/state-all-view/select.js";
import { rewriteEntityViewSelect } from "./steps/entity-view/select.js";
import { rewriteEntityViewInsert } from "./steps/entity-view/insert.js";
import { rewriteStateViewSelect } from "./steps/state-view/select.js";
import type { PreprocessorContext, PreprocessorStep } from "./types.js";

const pipeline: PreprocessorStep[] = [
	expandSqlViews,
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
	if (node.node_kind === "insert_statement") {
		return rewriteEntityViewInsert({
			node,
			getStoredSchemas: context.getStoredSchemas,
			getCacheTables: context.getCacheTables,
			getSqlViews: context.getSqlViews,
			hasOpenTransaction: context.hasOpenTransaction,
			trace: context.trace,
		}) as StatementNode;
	}

	if (node.node_kind !== "select_statement") {
		return node;
	}

	return pipeline.reduce<StatementNode>(
		(current, step) =>
			step({
				node: current,
				getStoredSchemas: context.getStoredSchemas,
				getCacheTables: context.getCacheTables,
				getSqlViews: context.getSqlViews,
				hasOpenTransaction: context.hasOpenTransaction,
				trace: context.trace,
			}) as StatementNode,
		node
	);
}
