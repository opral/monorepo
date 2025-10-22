import type { RootOperationNode } from "kysely";

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
 * const { query } = preprocessRootOperationNode({
 *   query: builder.toOperationNode(),
 *   storedSchemas: new Map(),
 *   cacheTables: new Map(),
 * });
 * ```
 */
export function preprocessRootOperationNode(
	input: RootOperationNode,
	options?: {
		storedSchemas: Map<string, unknown>;
		cacheTables: Map<string, unknown>;
	}
): RootOperationNode {
	return input;
}
