import type { RootOperationNode } from "kysely";
import type { PreprocessorStep, PreprocessorTrace } from "./types.js";
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

type PreprocessContext = {
	storedSchemas: Map<string, unknown>;
	cacheTables: Map<string, unknown>;
	trace?: PreprocessorTrace;
};

/**
 * Applies pre-processing transformations to a Kysely operation tree.
 *
 * The prototype currently behaves as a no-op, simply returning the provided
 * operation node so tests can exercise the integration surface. Subsequent
 * iterations will expand the implementation with AST visitors that rewrite the
 * internal state vtable query.
 *
 * @example
 * ```ts
 * const builder = internalQueryBuilder
 *   .selectFrom("lix_internal_state_vtable")
 *   .selectAll("lix_internal_state_vtable");
 *
 * const node = preprocessRootOperationNode({
 *   query: builder.toOperationNode(),
 *   storedSchemas: new Map(),
 *   cacheTables: new Map(),
 * });
 * ```
 */
export function preprocessRootOperationNode(
	input: RootOperationNode,
	context: PreprocessContext = {
		storedSchemas: new Map(),
		cacheTables: new Map(),
		trace: undefined,
	}
): RootOperationNode {
	return pipeline.reduce(
		(node, step) =>
			step({
				node,
				...context,
			}),
		input
	);
}
