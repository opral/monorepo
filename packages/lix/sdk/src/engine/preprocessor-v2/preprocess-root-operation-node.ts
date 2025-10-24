import type { RootOperationNode } from "kysely";
import type { PreprocessorStep, PreprocessorContext } from "./types.js";
import { rewriteEntityViewSelect } from "./steps/entity-view/select.js";
import { rewriteStateViewSelect } from "./steps/state-view/select.js";
import { rewriteStateAllViewSelect } from "./steps/state-all-view/select.js";
import { rewriteVtableSelects } from "./steps/rewrite-vtable-selects.js";

const pipeline: PreprocessorStep[] = [
	rewriteEntityViewSelect,
	rewriteStateViewSelect,
	rewriteStateAllViewSelect,
	rewriteVtableSelects,
];

/**
 * Runs the v2 preprocessor pipeline on a parsed Kysely operation tree.
 *
 * Steps currently include entity-view rewrites, state view rewrites, and
 * the vtable inlining transformer. Callers are expected to supply the
 * memoised preprocessing context (stored schemas, cache tables, transaction
 * flag, optional trace array).
 *
 * @example
 * ```ts
 * const operation = toRootOperationNode(parse("SELECT * FROM pipeline_schema"));
 * const context = getContext(engine); // see create-preprocessor.ts
 * const rewritten = preprocessRootOperationNode(operation, context);
 * ```
 */
export function preprocessRootOperationNode(
	input: RootOperationNode,
	context: PreprocessorContext
): RootOperationNode {
	return pipeline.reduce(
		(node, step) =>
			step({
				node,
				storedSchemas: context.storedSchemas,
				cacheTables: context.cacheTables,
				trace: context.trace,
				hasOpenTransaction: context.hasOpenTransaction,
			}),
		input
	);
}
