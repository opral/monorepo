import type { CommonTableExpressionNode } from "kysely";

/**
 * Returns the unqualified name of a common table expression.
 *
 * Helper for tests and transforms that need to reason about hoisted CTEs
 * without re-implementing node traversal logic.
 *
 * @example
 * ```ts
 * const cteName = extractCteName(cte);
 * ```
 */
export function extractCteName(
	node: CommonTableExpressionNode
): string | null {
	const tableNode = node.name.table;
	const identifier = tableNode.table.identifier;

	if (identifier.kind !== "IdentifierNode") {
		return null;
	}

	return identifier.name;
}
