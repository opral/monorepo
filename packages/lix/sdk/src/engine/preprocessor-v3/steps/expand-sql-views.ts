import type {
	SelectStatementNode,
	StatementNode,
	TableReferenceNode,
	SubqueryNode,
} from "../sql-parser/nodes.js";
import { identifier } from "../sql-parser/nodes.js";
import { normalizeIdentifierValue } from "../sql-parser/ast-helpers.js";
import { visitStatement, type AstVisitor } from "../sql-parser/visitor.js";
import { parse } from "../sql-parser/parse.js";
import type { PreprocessorStep, PreprocessorTraceEntry } from "../types.js";

type ViewDefinition = {
	readonly name: string;
	readonly sql: string;
	readonly normalized: string;
};

type ExpandState = {
	readonly stack: string[];
	readonly expandedViews: string[];
};

/**
 * Inlines SQLite views referenced in statements by expanding their SELECT
 * bodies into subqueries. Expansion is limited to selectable views and relies
 * on the v3 parser to convert the stored SQL into the AST representation.
 *
 * @example
 * ```ts
 * const rewritten = expandSqlViews({ node, getSqlViews });
 * ```
 */
export const expandSqlViews: PreprocessorStep = (context) => {
	const sqlViews = context.getSqlViews();
	if (sqlViews.size === 0) {
		return context.node;
	}

	const viewMap = buildViewMap(sqlViews);
	if (viewMap.size === 0) {
		return context.node;
	}

	const state: ExpandState = {
		stack: [],
		expandedViews: [],
	};

	const rewritten = expandStatementNode(
		context.node as StatementNode,
		viewMap,
		state
	);
	if (state.expandedViews.length === 0) {
		return context.node;
	}

	pushTrace(context.trace, state.expandedViews);
	return rewritten;
};

function buildViewMap(
	source: Map<string, string>
): Map<string, ViewDefinition> {
	const map = new Map<string, ViewDefinition>();
	for (const [name, sql] of source) {
		const normalized = normalizeIdentifierValue(name);
		map.set(normalized, { name, sql, normalized });
	}
	return map;
}

function expandStatementNode(
	statement: StatementNode,
	views: Map<string, ViewDefinition>,
	state: ExpandState
): StatementNode {
	return visitStatement(statement, createVisitor(views, state));
}

function createVisitor(
	views: Map<string, ViewDefinition>,
	state: ExpandState
): AstVisitor {
	return {
		table_reference(node) {
			const match = matchView(node, views);
			if (!match) {
				return;
			}

			const expanded = expandView(match, views, state);
			if (!expanded) {
				return;
			}

			state.expandedViews.push(match.name);
			const alias = node.alias ?? identifier(match.name);
			const subquery: SubqueryNode = {
				node_kind: "subquery",
				statement: expanded,
				alias,
			};
			return subquery;
		},
	};
}

function matchView(
	node: TableReferenceNode,
	views: Map<string, ViewDefinition>
): ViewDefinition | null {
	const parts = node.name.parts;
	if (parts.length === 0) {
		return null;
	}
	const last = parts[parts.length - 1];
	if (!last) {
		return null;
	}
	const normalized = normalizeIdentifierValue(last.value);
	return views.get(normalized) ?? null;
}

function expandView(
	view: ViewDefinition,
	views: Map<string, ViewDefinition>,
	state: ExpandState
): SelectStatementNode | null {
	if (state.stack.includes(view.normalized)) {
		return null;
	}

	state.stack.push(view.normalized);
	const parsed = parse(view.sql);
	if (parsed.node_kind !== "select_statement") {
		state.stack.pop();
		return null;
	}
	const expanded = expandStatementNode(
		parsed,
		views,
		state
	) as SelectStatementNode;
	state.stack.pop();
	return expanded;
}

function pushTrace(
	trace: PreprocessorTraceEntry[] | undefined,
	views: readonly string[]
): void {
	if (!trace) {
		return;
	}
	trace.push({
		step: "expand_sql_views",
		payload: {
			count: views.length,
			views: views.slice(),
		},
	});
}
