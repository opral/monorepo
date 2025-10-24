import type {
	SelectStatementNode,
	StatementNode,
	TableReferenceNode,
	SubqueryNode,
	SelectExpressionNode,
	RawFragmentNode,
} from "../../sql-parser/nodes.js";
import {
	visitSelectStatement,
	type AstVisitor,
} from "../../sql-parser/visitor.js";
import { getIdentifierValue } from "../../sql-parser/ast-helpers.js";
import { columnReference, identifier } from "../../sql-parser/nodes.js";
import type { PreprocessorStep, PreprocessorTraceEntry } from "../../types.js";

const STATE_VIEW_NAME = "state";
const STATE_ALL_TABLE = "state_all";

type StateReference = {
	readonly binding: string;
};

/**
 * Rewrites the public `state` view to reuse the `state_all` rewrite while
 * preserving the active-version filter that the view enforces.
 */
export const rewriteStateViewSelect: PreprocessorStep = (context) => {
	const node = context.node as StatementNode;
	if (node.node_kind !== "select_statement") {
		return node;
	}

	const references = collectStateReferences(node);
	if (references.length === 0) {
		return node;
	}

	pushTrace(context.trace, references);
	return rewriteSelectStatement(node, references);
};

function collectStateReferences(select: SelectStatementNode): StateReference[] {
	const bindings = new Map<string, StateReference>();

	const visitor: AstVisitor = {
		table_reference(node) {
			if (!isStateView(node)) {
				return;
			}
			const binding = getIdentifierValue(node.alias) ?? STATE_VIEW_NAME;
			bindings.set(binding, { binding });
		},
		subquery(node) {
			const nested = collectStateReferences(node.statement);
			for (const reference of nested) {
				bindings.set(reference.binding, reference);
			}
			return node;
		},
	};

	visitSelectStatement(select, visitor);
	return Array.from(bindings.values());
}

function rewriteSelectStatement(
	select: SelectStatementNode,
	references: readonly StateReference[]
): SelectStatementNode {
	const referenceMap = new Map<string, StateReference>();
	for (const reference of references) {
		referenceMap.set(reference.binding, reference);
	}

	const visitor: AstVisitor = {
		table_reference(node) {
			if (!isStateView(node)) {
				return;
			}
			const binding = getIdentifierValue(node.alias) ?? STATE_VIEW_NAME;
			const reference = referenceMap.get(binding);
			if (!reference) {
				return;
			}
			return buildStateSubquery(reference);
		},
		subquery(node) {
			const rewritten = rewriteSelectStatement(node.statement, references);
			if (rewritten !== node.statement) {
				return {
					...node,
					statement: rewritten,
				};
			}
			return node;
		},
	};

	return visitSelectStatement(select, visitor);
}

function isStateView(node: TableReferenceNode): boolean {
	const parts = node.name.parts;
	if (parts.length === 0) {
		return false;
	}
	const last = parts[parts.length - 1]!;
	return last.value === STATE_VIEW_NAME;
}

function buildStateSubquery(reference: StateReference): SubqueryNode {
	return {
		node_kind: "subquery",
		statement: buildStateSelect(),
		alias: identifier(reference.binding),
	};
}

function buildStateSelect(): SelectStatementNode {
	const projection: SelectExpressionNode[] = [
		columnSelect("entity_id"),
		columnSelect("schema_key"),
		columnSelect("file_id"),
		columnSelect("plugin_key"),
		columnSelect("snapshot_content"),
		columnSelect("schema_version"),
		columnSelect("created_at"),
		columnSelect("updated_at"),
		columnSelect("inherited_from_version_id"),
		columnSelect("change_id"),
		columnSelect("untracked"),
		columnSelect("commit_id"),
		columnSelect("writer_key"),
		columnSelect("metadata"),
	];

	const whereClause: RawFragmentNode = rawFragment(
		'"sa"."version_id" IN (SELECT "version_id" FROM "active_version")'
	);

	return {
		node_kind: "select_statement",
		projection,
		from_clauses: [
			{
				node_kind: "from_clause",
				relation: {
					node_kind: "table_reference",
					name: {
						node_kind: "object_name",
						parts: [identifier(STATE_ALL_TABLE)],
					},
					alias: identifier("sa"),
				},
				joins: [],
			},
		],
		where_clause: whereClause,
		order_by: [],
	};
}

function columnSelect(column: string): SelectExpressionNode {
	return {
		node_kind: "select_expression",
		expression: columnReference(["sa", column]),
		alias: identifier(column),
	};
}

function rawFragment(sql: string): RawFragmentNode {
	return {
		node_kind: "raw_fragment",
		sql_text: sql,
	};
}

function pushTrace(
	trace: PreprocessorTraceEntry[] | undefined,
	references: readonly StateReference[]
) {
	if (!trace) {
		return;
	}
	trace.push({
		step: "rewrite_state_view_select",
		payload: {
			reference_count: references.length,
			bindings: references.map((reference) => reference.binding),
		},
	});
}
