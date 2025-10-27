import type { StatementNode } from "./sql-parser/nodes.js";
import { expandSqlViews } from "./steps/expand-sql-views.js";
import { rewriteVtableSelects } from "./steps/rewrite-vtable-selects.js";
import { rewriteStateAllViewSelect } from "./steps/state-all-view/select.js";
import { rewriteEntityViewSelect } from "./steps/entity-view/select.js";
import { rewriteEntityViewUpdate } from "./steps/entity-view/update.js";
import { rewriteStateViewSelect } from "./steps/state-view/select.js";
import { rewriteEntityViewInsert } from "./steps/entity-view/insert.js";
import { rewriteEntityViewDelete } from "./steps/entity-view/delete.js";
import { cachePopulator } from "./steps/cache-populator.js";
import type { PreprocessorContext, PreprocessorStep } from "./types.js";

const pipeline: PreprocessorStep[] = [
	expandSqlViews,
	rewriteEntityViewInsert,
	rewriteEntityViewUpdate,
	rewriteEntityViewDelete,
	rewriteEntityViewSelect,
	rewriteStateViewSelect,
	rewriteStateAllViewSelect,
	cachePopulator,
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
	context: PreprocessorContext,
	parameters: ReadonlyArray<unknown> = []
): StatementNode {
	return pipeline.reduce<StatementNode>(
		(current, step) =>
			step({
				node: current,
				parameters,
				getStoredSchemas: context.getStoredSchemas,
				getCacheTables: context.getCacheTables,
				getSqlViews: context.getSqlViews,
				hasOpenTransaction: context.hasOpenTransaction,
				getCelEnvironment: context.getCelEnvironment,
				getEngine: context.getEngine,
				trace: context.trace,
			}) as StatementNode,
		node
	);
}
