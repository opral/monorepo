import { normalizeSegmentedStatement } from "../sql-parser/parse.js";
import {
	type CompoundSelectNode,
	identifier,
	columnReference,
	type IdentifierNode,
	type ObjectNameNode,
	type SegmentedStatementNode,
	type SelectExpressionNode,
	type SelectStatementNode,
	type SubqueryExpressionNode,
	type SubqueryNode,
	type TableReferenceNode,
	type FromClauseNode,
	type BinaryExpressionNode,
	type LiteralNode,
	type FunctionCallExpressionNode,
} from "../sql-parser/nodes.js";
import {
	objectNameMatches,
	normalizeIdentifierValue,
} from "../sql-parser/ast-helpers.js";
import { visitStatement, type AstVisitor } from "../sql-parser/visitor.js";
import {
	collectTableColumnUsage,
	type ColumnUsageSummary,
	type TableColumnUsageMap,
} from "../sql-parser/column-usage.js";
import type { PreprocessorStep } from "../types.js";
import { INTERNAL_STATE_VTABLE } from "../steps/rewrite-vtable-selects.js";
import { STATE_BY_VERSION_VIEW } from "./shared.js";

const VIEW_COLUMN_NAMES = [
	"entity_id",
	"schema_key",
	"file_id",
	"version_id",
	"plugin_key",
	"snapshot_content",
	"schema_version",
	"created_at",
	"updated_at",
	"inherited_from_version_id",
	"change_id",
	"untracked",
	"commit_id",
	"writer_key",
] as const;

const CHANGE_TABLE = "change";
const CHANGE_ALIAS = "__sbv_change";

/**
 * Rewrites SELECT statements that reference the `state_by_version` view to read
 * directly from the internal state vtable. The rewritten statements are then
 * processed by the downstream vtable select rewrite step.
 *
 * @example
 * ```ts
 * const rewritten = rewriteStateByVersionSelect({ statements, parameters: [] });
 * ```
 */
export const rewriteStateByVersionSelect: PreprocessorStep = (context) => {
	let anyChanges = false;
	let totalRewrites = 0;
	const rewrittenStatements = context.statements.map((statement) => {
		const result = rewriteSegmentedStatement(statement);
		totalRewrites += result.rewrites;
		if (result.node !== statement) {
			anyChanges = true;
		}
		return result.node;
	});

	if (totalRewrites > 0) {
		context.trace?.push({
			step: "rewrite_state_by_version_select",
			payload: { tables: totalRewrites },
		});
	}

	return anyChanges ? rewrittenStatements : context.statements;
};

type SegmentedRewriteResult = {
	readonly node: SegmentedStatementNode;
	readonly rewrites: number;
};

function rewriteSegmentedStatement(
	statement: SegmentedStatementNode
): SegmentedRewriteResult {
	let rewrites = 0;
	let changed = false;
	const segments = statement.segments.map((segment) => {
		if (segment.node_kind === "select_statement") {
			const result = rewriteSelectStatement(segment);
			rewrites += result.rewrites;
			if (result.node !== segment) {
				changed = true;
			}
			return result.node;
		}
		if (segment.node_kind === "compound_select") {
			const result = rewriteCompoundSelect(segment);
			rewrites += result.rewrites;
			if (result.node !== segment) {
				changed = true;
			}
			return result.node;
		}
		return segment;
	});

	if (!changed) {
		return { node: statement, rewrites };
	}

	return {
		node: normalizeSegmentedStatement({
			...statement,
			segments,
		}),
		rewrites,
	};
}

type SelectRewriteResult<T extends SelectStatementNode | CompoundSelectNode> = {
	readonly node: T;
	readonly rewrites: number;
};

function rewriteSelectStatement(
	statement: SelectStatementNode
): SelectRewriteResult<SelectStatementNode> {
	return rewriteSelectLike(statement);
}

function rewriteCompoundSelect(
	statement: CompoundSelectNode
): SelectRewriteResult<CompoundSelectNode> {
	return rewriteSelectLike(statement);
}

function rewriteSelectLike<T extends SelectStatementNode | CompoundSelectNode>(
	statement: T
): SelectRewriteResult<T> {
	let rewrites = 0;
	const rewritten = visitStatement(
		statement,
		buildVisitor(() => {
			rewrites += 1;
		})
	) as T;

	return { node: rewritten, rewrites };
}

function buildVisitor(onRewrite: () => void): AstVisitor {
	const usageCache = new WeakMap<SelectStatementNode, TableColumnUsageMap>();
	const selectStack: SelectStatementNode[] = [];
	return {
		enter(node) {
			if (node.node_kind === "select_statement") {
				selectStack.push(node as SelectStatementNode);
			}
		},
		select_statement_exit() {
			selectStack.pop();
		},
		table_reference(node) {
			if (!objectNameMatches(node.name, STATE_BY_VERSION_VIEW)) {
				return;
			}
			const currentSelect = selectStack[selectStack.length - 1];
			if (!currentSelect) {
				return;
			}
			const usageMap = ensureUsageMap(currentSelect, usageCache);
			return rewriteTableReference(node, usageMap, onRewrite);
		},
	};
}

function ensureUsageMap(
	select: SelectStatementNode,
	cache: WeakMap<SelectStatementNode, TableColumnUsageMap>
): TableColumnUsageMap {
	let existing = cache.get(select);
	if (existing) {
		return existing;
	}
	const next = collectTableColumnUsage(select);
	cache.set(select, next);
	return next;
}

function rewriteTableReference(
	node: TableReferenceNode,
	usageMap: TableColumnUsageMap,
	onRewrite: () => void
): TableReferenceNode | SubqueryNode | void {
	const aliasNode = node.alias;
	const aliasKey = normalizeIdentifierValue(
		aliasNode ? aliasNode.value : STATE_BY_VERSION_VIEW
	);
	const usageSummary = usageMap.get(aliasKey);

	onRewrite();
	return buildStateByVersionSubquery(aliasNode, usageSummary);
}

function buildStateByVersionSubquery(
	alias: IdentifierNode | null,
	usage: ColumnUsageSummary | undefined
): SubqueryNode {
	const { columns, includeMetadata } = selectProjectionColumns(usage);
	const projection: SelectExpressionNode[] = columns.map((column) =>
		buildColumnProjection(column)
	);
	if (includeMetadata) {
		projection.push(buildMetadataProjection());
	}

	const statement: SelectStatementNode = {
		node_kind: "select_statement",
		distinct: false,
		projection,
		from_clauses: [buildFromClause()],
		where_clause: buildSnapshotFilter(),
		group_by: [],
		order_by: [],
		limit: null,
		offset: null,
		with_clause: null,
	};

	const result: SubqueryNode = {
		node_kind: "subquery",
		statement,
		alias: alias ?? identifier(STATE_BY_VERSION_VIEW),
	};

	return result;
}

function selectProjectionColumns(usage: ColumnUsageSummary | undefined): {
	columns: string[];
	includeMetadata: boolean;
} {
	const allowedColumns = new Set([...VIEW_COLUMN_NAMES, "metadata"]);
	if (usage) {
		for (const column of usage.columns) {
			if (!allowedColumns.has(column)) {
				throw new Error(
					`Column '${column}' is not exposed by state_by_version`
				);
			}
		}
	}
	const columns = usage?.columns ?? new Set<string>();
	const requireAll = !usage || usage.requiresAllColumns || columns.size === 0;
	const includeMetadata = requireAll || columns.has("metadata");
	const baseColumns = requireAll
		? [...VIEW_COLUMN_NAMES]
		: VIEW_COLUMN_NAMES.filter((column) => columns.has(column));
	if (baseColumns.length === 0 && !includeMetadata) {
		return { columns: [...VIEW_COLUMN_NAMES], includeMetadata: true };
	}
	return {
		columns: baseColumns,
		includeMetadata,
	};
}

function buildColumnProjection(column: string): SelectExpressionNode {
	return {
		node_kind: "select_expression",
		expression: columnReference([column]),
		alias: null,
	};
}

function buildMetadataProjection(): SelectExpressionNode {
	const changeAlias = identifier(CHANGE_ALIAS);

	const metadataCall: FunctionCallExpressionNode = {
		node_kind: "function_call",
		name: identifier("json"),
		arguments: [columnReference([changeAlias.value, "metadata"])],
		over: null,
	};

	const metadataSelect: SelectStatementNode = {
		node_kind: "select_statement",
		distinct: false,
		projection: [
			{
				node_kind: "select_expression",
				expression: metadataCall,
				alias: null,
			},
		],
		from_clauses: [
			{
				node_kind: "from_clause",
				relation: buildTableReference(CHANGE_TABLE, changeAlias),
				joins: [],
			},
		],
		where_clause: {
			node_kind: "binary_expression",
			left: columnReference([changeAlias.value, "id"]),
			operator: "=",
			right: columnReference(["change_id"]),
		},
		group_by: [],
		order_by: [],
		limit: null,
		offset: null,
		with_clause: null,
	};

	const subquery: SubqueryExpressionNode = {
		node_kind: "subquery_expression",
		statement: metadataSelect,
	};

	return {
		node_kind: "select_expression",
		expression: subquery,
		alias: identifier("metadata"),
	};
}

function buildSnapshotFilter(): BinaryExpressionNode {
	return {
		node_kind: "binary_expression",
		left: columnReference(["snapshot_content"]),
		operator: "is_not",
		right: createLiteralNode(null),
	};
}

function buildFromClause(): FromClauseNode {
	return {
		node_kind: "from_clause",
		relation: buildTableReference(INTERNAL_STATE_VTABLE, null),
		joins: [],
	};
}

function buildTableReference(
	name: string,
	alias: IdentifierNode | null
): TableReferenceNode {
	return {
		node_kind: "table_reference",
		name: buildObjectName(name),
		alias,
	};
}

function buildObjectName(name: string): ObjectNameNode {
	return {
		node_kind: "object_name",
		parts: [identifier(name)],
	};
}

function createLiteralNode(value: LiteralNode["value"]): LiteralNode {
	return {
		node_kind: "literal",
		value,
	};
}
