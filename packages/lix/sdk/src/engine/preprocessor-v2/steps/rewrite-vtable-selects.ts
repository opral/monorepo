import {
	IdentifierNode,
	OperationNodeTransformer,
	type QueryId,
	type RootOperationNode,
	type SchemableIdentifierNode,
	type TableNode,
} from "kysely";
import type { PreprocessorStep } from "../types.js";

const INTERNAL_STATE_VTABLE = "lix_internal_state_vtable";
const REWRITTEN_STATE_VTABLE = "lix_internal_state_vtable_rewritten";

class RewriteInternalStateVtableTransformer extends OperationNodeTransformer {
	override transformTable(
		node: TableNode,
		queryId?: QueryId
	): TableNode {
		const transformed = super.transformTable(node, queryId);
		if (isInternalStateTable(transformed)) {
			return {
				...transformed,
				table: rewriteIdentifier(transformed.table),
			};
		}
		return transformed;
	}
}

function isInternalStateTable(node: TableNode): boolean {
	const table = node.table;
	return (
		table.kind === "SchemableIdentifierNode" &&
		table.schema === undefined &&
		table.identifier.kind === "IdentifierNode" &&
		table.identifier.name === INTERNAL_STATE_VTABLE
	);
}

function rewriteIdentifier(
	node: SchemableIdentifierNode
): SchemableIdentifierNode {
	return {
		...node,
		identifier: IdentifierNode.create(REWRITTEN_STATE_VTABLE),
	};
}

const transformer = new RewriteInternalStateVtableTransformer();

/**
 * Prototype transform that will eventually rewrite queries targeting the
 * internal vtable into equivalent native SQLite statements.
 *
 * The initial implementation renames the underlying table reference so the
 * rewritten pipeline can assert the correct execution path before the full
 * CTE machinery is ported.
 *
 * @example
 * ```ts
 * const transformed = rewriteVtableSelects({
 *   node,
 *   storedSchemas,
 *   cacheTables,
 * });
 * ```
 */
export const rewriteVtableSelects: PreprocessorStep = ({ node }) =>
	transformer.transformNode(node) as RootOperationNode;
