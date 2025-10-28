import type {
	SelectStatementNode,
	StatementNode,
	TableReferenceNode,
	SubqueryNode,
	SelectExpressionNode,
	RawFragmentNode,
	SelectItemNode,
	ExpressionNode,
	JoinClauseNode,
} from "../../sql-parser/nodes.js";
import {
	visitSelectStatement,
	type AstVisitor,
} from "../../sql-parser/visitor.js";
import {
	getColumnName,
	getColumnQualifier,
	getIdentifierValue,
	normalizeIdentifierValue,
} from "../../sql-parser/ast-helpers.js";
import { columnReference, identifier } from "../../sql-parser/nodes.js";
import type { PreprocessorStep, PreprocessorTraceEntry } from "../../types.js";

const STATE_VIEW_NAME = "state";
const STATE_ALL_TABLE = "state_all";
const STATE_COLUMNS = [
	"entity_id",
	"schema_key",
	"file_id",
	"plugin_key",
	"snapshot_content",
	"version_id",
	"schema_version",
	"created_at",
	"updated_at",
	"inherited_from_version_id",
	"change_id",
	"untracked",
	"commit_id",
	"writer_key",
	"metadata",
] as const;

type StateReference = {
	readonly binding: string;
	readonly usedColumns: Set<string> | null;
	readonly schemaFilters: Set<string> | null;
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
	const references = new Map<string, StateReference>();
	collectFromSelect(select, references);
	return Array.from(references.values());
}

function collectFromSelect(
	select: SelectStatementNode,
	references: Map<string, StateReference>
) {
	for (const fromClause of select.from_clauses) {
		collectFromRelation(fromClause.relation, select, references);
		for (const join of fromClause.joins) {
			collectJoinUsage(join, select, references);
		}
	}
}

function collectFromRelation(
	relation: SelectStatementNode["from_clauses"][number]["relation"],
	parentSelect: SelectStatementNode,
	references: Map<string, StateReference>
) {
	if (relation.node_kind === "table_reference") {
		if (!isStateView(relation)) {
			return;
		}
		const binding = getIdentifierValue(relation.alias) ?? STATE_VIEW_NAME;
		const usage = collectStateColumnUsage(parentSelect, binding);
		const schemaFilters = collectStateSchemaFilters(parentSelect, binding);
		const existing = references.get(binding);
		if (!existing) {
			references.set(binding, {
				binding,
				usedColumns: usage,
				schemaFilters,
			});
		} else {
			references.set(binding, {
				binding,
				usedColumns: mergeColumnUsage(existing.usedColumns, usage),
				schemaFilters: mergeSchemaFilters(
					existing.schemaFilters,
					schemaFilters
				),
			});
		}
		return;
	}

	if (relation.node_kind === "subquery") {
		collectFromSelect(relation.statement, references);
	}
}

function collectJoinUsage(
	join: JoinClauseNode,
	parentSelect: SelectStatementNode,
	references: Map<string, StateReference>
) {
	collectFromRelation(join.relation, parentSelect, references);
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
		statement: buildStateSelect(reference),
		alias: identifier(reference.binding),
	};
}

function buildStateSelect(reference: StateReference): SelectStatementNode {
	const usedColumns = reference.usedColumns;
	const columnSet =
		usedColumns === null || usedColumns.size === 0
			? new Set(STATE_COLUMNS)
			: new Set(usedColumns);

	// Ensure snapshot_content is available for JSON projections generated via raw fragments.
	columnSet.add("snapshot_content");

	const projection: SelectExpressionNode[] = [];
	for (const column of STATE_COLUMNS) {
		if (columnSet.has(column)) {
			projection.push(columnSelect(column));
		}
	}

	if (projection.length === 0) {
		projection.push(columnSelect("entity_id"));
	}

	const versionFilter: RawFragmentNode = rawFragment(
		'"sa"."version_id" IN (SELECT "version_id" FROM "active_version")'
	);
	let whereClause: ExpressionNode | RawFragmentNode = versionFilter;
	if (reference.schemaFilters && reference.schemaFilters.size > 0) {
		const schemaExpression = buildStateSchemaFilterExpression(
			reference.schemaFilters
		);
		whereClause = {
			node_kind: "binary_expression",
			left: schemaExpression,
			operator: "and",
			right: versionFilter,
		};
	}

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
		limit: null,
		offset: null,
	};
}

function columnSelect(column: string): SelectExpressionNode {
	return {
		node_kind: "select_expression",
		expression: columnReference(["sa", column]),
		alias: identifier(column),
	};
}

function buildStateSchemaFilterExpression(values: Set<string>): ExpressionNode {
	const literals = Array.from(values);
	if (literals.length === 1) {
		return {
			node_kind: "binary_expression",
			left: columnReference(["sa", "schema_key"]),
			operator: "=",
			right: {
				node_kind: "literal",
				value: literals[0]!,
			},
		};
	}
	return {
		node_kind: "in_list_expression",
		operand: columnReference(["sa", "schema_key"]),
		items: literals.map((value) => ({
			node_kind: "literal",
			value,
		})),
		negated: false,
	};
}

function rawFragment(sql: string): RawFragmentNode {
	return {
		node_kind: "raw_fragment",
		sql_text: sql,
	};
}

function collectStateColumnUsage(
	select: SelectStatementNode,
	binding: string
): Set<string> | null {
	const normalizedBinding = normalizeIdentifierValue(binding);
	const columns = new Set<string>();
	let selectAll = false;

	for (const item of select.projection) {
		selectAll = processStateSelectItem(
			item,
			binding,
			normalizedBinding,
			columns
		);
		if (selectAll) {
			return null;
		}
	}

	if (select.where_clause) {
		collectColumnsFromExpressionLike(
			select.where_clause,
			binding,
			normalizedBinding,
			columns
		);
	}

	for (const orderItem of select.order_by) {
		collectColumnsFromExpressionLike(
			orderItem.expression,
			binding,
			normalizedBinding,
			columns
		);
	}

	for (const fromClause of select.from_clauses) {
		for (const join of fromClause.joins) {
			if (join.on_expression) {
				collectColumnsFromExpressionLike(
					join.on_expression,
					binding,
					normalizedBinding,
					columns
				);
			}
		}
	}

	return columns;
}

function collectStateSchemaFilters(
	select: SelectStatementNode,
	binding: string
): Set<string> | null {
	const whereClause = select.where_clause;
	if (!whereClause || "sql_text" in whereClause) {
		return null;
	}
	const normalizedBinding = normalizeIdentifierValue(binding);
	const expression = unwrapGroupedExpression(whereClause);
	if (expression.node_kind !== "binary_expression") {
		return null;
	}
	const operator = expression.operator.toLowerCase();
	if (operator !== "=" && operator !== "is") {
		return null;
	}
	const values = new Set<string>();
	if (isSchemaKeyReference(expression.left, normalizedBinding)) {
		const literal = extractLiteralValue(expression.right);
		if (literal) {
			values.add(literal);
		} else {
			return null;
		}
	}
	if (isSchemaKeyReference(expression.right, normalizedBinding)) {
		const literal = extractLiteralValue(expression.left);
		if (literal) {
			values.add(literal);
		} else {
			return null;
		}
	}
	return values.size > 0 ? values : null;
}

function unwrapGroupedExpression(expression: ExpressionNode): ExpressionNode {
	let current = expression;
	while (current.node_kind === "grouped_expression") {
		current = current.expression;
	}
	return current;
}

function isSchemaKeyReference(
	expression: ExpressionNode,
	binding: string
): boolean {
	if (expression.node_kind !== "column_reference") {
		return false;
	}
	const qualifier = getColumnQualifier(expression);
	if (qualifier !== null && normalizeIdentifierValue(qualifier) !== binding) {
		return false;
	}
	return getColumnName(expression) === "schema_key";
}

function extractLiteralValue(expression: ExpressionNode): string | null {
	const unwrapped = unwrapGroupedExpression(expression);
	if (unwrapped.node_kind !== "literal") {
		return null;
	}
	return typeof unwrapped.value === "string" ? unwrapped.value : null;
}

function processStateSelectItem(
	item: SelectItemNode,
	binding: string,
	normalizedBinding: string,
	columns: Set<string>
): boolean {
	switch (item.node_kind) {
		case "select_star":
			return true;
		case "select_qualified_star": {
			const qualifier = item.qualifier.at(-1);
			if (!qualifier) {
				return true;
			}
			return normalizeIdentifierValue(qualifier.value) === normalizedBinding;
		}
		case "select_expression": {
			const expression = item.expression;
			if (expression.node_kind === "raw_fragment") {
				if (
					rawFragmentReferencesColumn(
						expression.sql_text,
						binding,
						"snapshot_content"
					)
				) {
					columns.add("snapshot_content");
				}
				return false;
			}
			collectColumnsFromExpressionLike(
				expression,
				binding,
				normalizedBinding,
				columns
			);
			return false;
		}
		default:
			return false;
	}
}

function collectColumnsFromExpressionLike(
	expression:
		| ExpressionNode
		| SelectStatementNode["where_clause"]
		| JoinClauseNode["on_expression"],
	binding: string,
	normalizedBinding: string,
	columns: Set<string>
): void {
	if (!expression) {
		return;
	}

	if (expression.node_kind === "raw_fragment") {
		if (
			rawFragmentReferencesColumn(
				expression.sql_text,
				binding,
				"snapshot_content"
			)
		) {
			columns.add("snapshot_content");
		}
		return;
	}

	switch (expression.node_kind) {
		case "column_reference": {
			const qualifier = getColumnQualifier(expression);
			if (
				qualifier === null ||
				normalizeIdentifierValue(qualifier) === normalizedBinding
			) {
				columns.add(getColumnName(expression));
			}
			break;
		}
		case "binary_expression":
			collectColumnsFromExpressionLike(
				expression.left,
				binding,
				normalizedBinding,
				columns
			);
			collectColumnsFromExpressionLike(
				expression.right,
				binding,
				normalizedBinding,
				columns
			);
			break;
		case "grouped_expression":
			collectColumnsFromExpressionLike(
				expression.expression,
				binding,
				normalizedBinding,
				columns
			);
			break;
		case "unary_expression":
			collectColumnsFromExpressionLike(
				expression.operand,
				binding,
				normalizedBinding,
				columns
			);
			break;
		case "between_expression":
			collectColumnsFromExpressionLike(
				expression.operand,
				binding,
				normalizedBinding,
				columns
			);
			collectColumnsFromExpressionLike(
				expression.start,
				binding,
				normalizedBinding,
				columns
			);
			collectColumnsFromExpressionLike(
				expression.end,
				binding,
				normalizedBinding,
				columns
			);
			break;
		case "in_list_expression":
			collectColumnsFromExpressionLike(
				expression.operand,
				binding,
				normalizedBinding,
				columns
			);
			for (const item of expression.items) {
				collectColumnsFromExpressionLike(
					item,
					binding,
					normalizedBinding,
					columns
				);
			}
			break;
		default:
			break;
	}
}

function rawFragmentReferencesColumn(
	sql: string,
	binding: string,
	column: string
): boolean {
	const escapedBinding = escapeRegExp(binding);
	const pattern = new RegExp(
		`"${escapedBinding}"\\."${escapeRegExp(column)}"`,
		"i"
	);
	return pattern.test(sql);
}

function escapeRegExp(value: string): string {
	return value.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
}

function mergeColumnUsage(
	existing: Set<string> | null,
	next: Set<string> | null
): Set<string> | null {
	if (existing === null || next === null) {
		return null;
	}
	const merged = new Set(existing);
	for (const column of next) {
		merged.add(column);
	}
	return merged;
}

function mergeSchemaFilters(
	existing: Set<string> | null,
	next: Set<string> | null
): Set<string> | null {
	if (existing === null) {
		return next === null ? null : new Set(next);
	}
	if (next === null) {
		return existing;
	}
	const merged = new Set(existing);
	for (const value of next) {
		merged.add(value);
	}
	return merged;
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
