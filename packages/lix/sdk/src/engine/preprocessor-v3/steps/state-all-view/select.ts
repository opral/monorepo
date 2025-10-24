import type {
	StatementNode,
	SelectStatementNode,
	SelectExpressionNode,
	ExpressionNode,
	SelectItemNode,
} from "../../sql-parser/nodes.js";
import {
	identifier,
	columnReference,
} from "../../sql-parser/nodes.js";
import {
	visitSelectStatement,
	type AstVisitor,
} from "../../sql-parser/visitor.js";
import {
	getIdentifierValue,
	objectNameMatches,
	normalizeIdentifierValue,
	getColumnQualifier,
	getColumnName,
} from "../../sql-parser/ast-helpers.js";
import type { PreprocessorStep, PreprocessorTraceEntry } from "../../types.js";

const STATE_ALL_VIEW = "state_all";
const STATE_VTABLE = "lix_internal_state_vtable";
const DEFAULT_BINDING = STATE_ALL_VIEW;

/**
 * Rewrites references to the `state_all` SQLite view so they target the
 * underlying vtable directly.
 *
 * @example
 * ```ts
 * const rewritten = rewriteStateAllViewSelect({ node: statement, trace });
 * ```
 */
export const rewriteStateAllViewSelect: PreprocessorStep = (context) => {
	const node = context.node as StatementNode;
	if (node.node_kind !== "select_statement") {
		return node;
	}

	const references: string[] = [];
	const rewritten = rewriteSelectNode(node, references);

	if (references.length === 0) {
		return node;
	}

	context.trace?.push(buildTraceEntry(references));
	return rewritten;
};

function rewriteSelectNode(
	select: SelectStatementNode,
	references: string[]
): SelectStatementNode {
	const visitor: AstVisitor = {
		subquery(node) {
			const rewrittenStatement = rewriteSelectNode(node.statement, references);
			if (rewrittenStatement !== node.statement) {
				return {
					...node,
					statement: rewrittenStatement,
				};
			}
			return node;
		},
		table_reference(node) {
			if (!objectNameMatches(node.name, STATE_ALL_VIEW)) {
				return;
			}
			const binding = getIdentifierValue(node.alias) ?? DEFAULT_BINDING;
			references.push(binding);
			const columns = collectReferencedColumns(select, binding);
			return createStateAllSubquery(binding, columns);
		},
	};

	return visitSelectStatement(select, visitor);
}

function createStateAllSubquery(
	binding: string,
	columns: Set<string> | null
) {
	return {
		node_kind: "subquery" as const,
		statement: buildStateAllSelect(columns),
		alias: identifier(binding),
	};
}

function buildStateAllSelect(columns: Set<string> | null): SelectStatementNode {
	const projection = buildProjection(columns);

	const whereClause: ExpressionNode = {
		node_kind: "binary_expression",
		left: columnReference(["v", "snapshot_content"]),
		operator: "is_not",
		right: {
			node_kind: "literal",
			value: null,
		},
	};

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
						parts: [identifier(STATE_VTABLE)],
					},
					alias: identifier("v"),
				},
				joins: [],
			},
		],
		where_clause: whereClause,
		order_by: [],
	};
}

function columnSelect(path: readonly string[], alias: string): SelectExpressionNode {
	return {
		node_kind: "select_expression",
		expression: columnReference(path),
		alias: identifier(alias),
	};
}

function metadataSelectExpression(): SelectExpressionNode {
	return {
		node_kind: "select_expression",
		expression: {
			node_kind: "raw_fragment",
			sql_text:
				'(SELECT json(metadata) FROM "change" WHERE "change"."id" = "v"."change_id")',
		},
		alias: identifier("metadata"),
	};
}

const BASE_STATE_ALL_COLUMNS = [
	"entity_id",
	"schema_key",
	"file_id",
	"plugin_key",
	"snapshot_content",
	"schema_version",
	"version_id",
	"created_at",
	"updated_at",
	"inherited_from_version_id",
	"change_id",
	"untracked",
	"commit_id",
	"writer_key",
] as const;

const METADATA_COLUMN = "metadata";

const STATE_ALL_COLUMNS = new Set<string>([...BASE_STATE_ALL_COLUMNS, METADATA_COLUMN]);
const MANDATORY_COLUMNS = new Set<string>(["schema_key", "snapshot_content"]);

function buildProjection(columns: Set<string> | null): SelectExpressionNode[] {
	const result: SelectExpressionNode[] = [];
	const selectAll = columns === null || columns.size === 0;
	const target = selectAll ? STATE_ALL_COLUMNS : columns;

	for (const column of BASE_STATE_ALL_COLUMNS) {
		if (selectAll || target.has(column)) {
			result.push(columnSelect(["v", column], column));
		}
	}

	if (selectAll || target.has(METADATA_COLUMN)) {
		result.push(metadataSelectExpression());
	}

	return result;
}

function collectReferencedColumns(
	select: SelectStatementNode,
	binding: string
): Set<string> | null {
	const normalizedBinding = normalizeIdentifierValue(binding);
	const columns = new Set<string>();
	let selectAll = false;

	for (const item of select.projection) {
		if (processProjectionItem(item, normalizedBinding, columns)) {
			selectAll = true;
			break;
		}
	}

	if (!selectAll && select.where_clause) {
		collectColumnsFromExpression(select.where_clause, normalizedBinding, columns);
	}

	if (!selectAll && select.order_by.length > 0) {
		for (const orderItem of select.order_by) {
			collectColumnsFromExpression(orderItem.expression, normalizedBinding, columns);
		}
	}

	if (selectAll) {
		return null;
	}

	const filtered = new Set<string>();
	for (const column of columns) {
		if (STATE_ALL_COLUMNS.has(column)) {
			filtered.add(column);
		}
	}

	for (const column of MANDATORY_COLUMNS) {
		filtered.add(column);
	}

	return filtered.size === 0 ? new Set<string>(MANDATORY_COLUMNS) : filtered;
}

function processProjectionItem(
	item: SelectItemNode,
	binding: string,
	columns: Set<string>
): boolean {
	switch (item.node_kind) {
		case "select_star":
			return true;
		case "select_qualified_star": {
			const parts = item.qualifier;
			if (parts.length === 0) {
				return true;
			}
			const last = parts[parts.length - 1]!;
			if (normalizeIdentifierValue(last.value) === binding) {
				return true;
			}
			return false;
		}
		case "select_expression":
			collectColumnsFromExpression(item.expression, binding, columns);
			return false;
		default:
			return false;
	}
}

function collectColumnsFromExpression(
	expression: ExpressionNode,
	binding: string,
	columns: Set<string>
): void {
	if ("sql_text" in expression) {
		return;
	}
	switch (expression.node_kind) {
		case "column_reference": {
			const qualifier = getColumnQualifier(expression);
			const matches =
				qualifier === null || normalizeIdentifierValue(qualifier) === binding;
			if (matches) {
				columns.add(getColumnName(expression));
			}
			break;
		}
		case "grouped_expression":
			collectColumnsFromExpression(expression.expression, binding, columns);
			break;
		case "binary_expression":
			collectColumnsFromExpression(expression.left, binding, columns);
			collectColumnsFromExpression(expression.right, binding, columns);
			break;
		case "unary_expression":
			collectColumnsFromExpression(expression.operand, binding, columns);
			break;
		case "in_list_expression":
			collectColumnsFromExpression(expression.operand, binding, columns);
			for (const item of expression.items) {
				collectColumnsFromExpression(item, binding, columns);
			}
			break;
		case "between_expression":
			collectColumnsFromExpression(expression.operand, binding, columns);
			collectColumnsFromExpression(expression.start, binding, columns);
			collectColumnsFromExpression(expression.end, binding, columns);
			break;
		case "parameter":
		case "literal":
			break;
	}
}

function buildTraceEntry(bindings: readonly string[]): PreprocessorTraceEntry {
	return {
		step: "rewrite_state_all_view_select",
		payload: {
			reference_count: bindings.length,
			bindings: bindings.slice(),
		},
	};
}
