import {
	CommonTableExpressionNameNode,
	CommonTableExpressionNode,
	IdentifierNode,
	OperationNodeTransformer,
	RawNode,
	SelectQueryNode,
	WithNode,
	type QueryId,
	type RootOperationNode,
	type SchemableIdentifierNode,
	type TableNode,
} from "kysely";
import { extractCteName } from "../utils.js";
import type { PreprocessorStep } from "../types.js";

export const INTERNAL_STATE_VTABLE = "lix_internal_state_vtable";
export const REWRITTEN_STATE_VTABLE = "lix_internal_state_vtable_rewritten";

const HOISTED_REWRITE_SQL = `-- hoisted_lix_internal_state_vtable_rewrite
SELECT 1 AS noop
`;

/**
 * Prototype transform that will eventually rewrite queries targeting the
 * internal vtable into equivalent native SQLite statements.
 *
 * The initial implementation renames the underlying table reference and hoists
 * a placeholder CTE so the pipeline can be exercised while the full rewrite is
 * ported.
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
export const rewriteVtableSelects: PreprocessorStep = ({ node }) => {
	const transformer = new RewriteInternalStateVtableTransformer();
	const rewritten = transformer.transformNode(node) as RootOperationNode;
	if (!transformer.touched) {
		return rewritten;
	}
	if (!SelectQueryNode.is(rewritten)) {
		return rewritten;
	}
	return ensureRewriteCte(rewritten);
};

class RewriteInternalStateVtableTransformer extends OperationNodeTransformer {
	public touched = false;

	override transformTable(node: TableNode, queryId?: QueryId): TableNode {
		const transformed = super.transformTable(node, queryId);
		if (isInternalStateTable(transformed)) {
			this.touched = true;
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

function ensureRewriteCte(select: SelectQueryNode): SelectQueryNode {
	const expressions = select.with?.expressions ?? [];
	const alreadyPresent = expressions.some(
		(cte) => extractCteName(cte) === REWRITTEN_STATE_VTABLE
	);
	if (alreadyPresent) {
		return select;
	}

	const name = CommonTableExpressionNameNode.create(REWRITTEN_STATE_VTABLE);
	const expression = RawNode.createWithSql(HOISTED_REWRITE_SQL);
	const rewriteCte = CommonTableExpressionNode.create(name, expression);
	const withNode = select.with
		? WithNode.cloneWithExpression(select.with, rewriteCte)
		: WithNode.create(rewriteCte);

	return {
		...select,
		with: withNode,
	};
}
