import type {
	SegmentedStatementNode,
	SelectStatementNode,
	StatementNode,
	StatementSegmentNode,
	TableReferenceNode,
	SubqueryNode,
} from "../sql-parser/nodes.js";
import { identifier } from "../sql-parser/nodes.js";
import { normalizeIdentifierValue } from "../sql-parser/ast-helpers.js";
import { visitStatement, type AstVisitor } from "../sql-parser/visitor.js";
import { parse, normalizeSegmentedStatement } from "../sql-parser/parse.js";
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
	const sqlViews = context.getSqlViews?.();
	if (!sqlViews || sqlViews.size === 0) {
		return context.statements;
	}

	const viewMap = buildViewMap(sqlViews);
	if (viewMap.size === 0) {
		return context.statements;
	}

	let anyChanges = false;
	const rewrittenStatements = context.statements.map((statement) => {
		const result = expandSegmentedStatement(statement, viewMap, context.trace);
		if (result !== statement) {
			anyChanges = true;
		}
		return result;
	});

	return anyChanges ? rewrittenStatements : context.statements;
};

function expandSegmentedStatement(
	statement: SegmentedStatementNode,
	views: Map<string, ViewDefinition>,
	trace: PreprocessorTraceEntry[] | undefined
): SegmentedStatementNode {
	let expandedViewNames: string[] = [];
	const updatedSegments: StatementSegmentNode[] = statement.segments.map(
		(segment) => {
			if (segment.node_kind !== "select_statement") {
				return segment;
			}

			const state: ExpandState = {
				stack: [],
				expandedViews: [],
			};

			const expanded = expandStatementNode(
				segment as StatementNode,
				views,
				state
			);
			if (state.expandedViews.length === 0) {
				return segment;
			}

			expandedViewNames = expandedViewNames.concat(state.expandedViews);
			return expanded;
		}
	);

	if (expandedViewNames.length === 0) {
		return statement;
	}

	if (trace) {
		pushTrace(trace, expandedViewNames);
	}

	return normalizeSegmentedStatement({
		...statement,
		segments: updatedSegments,
	});
}

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
	const statements = parse(view.sql);
	if (statements.length !== 1) {
		state.stack.pop();
		return null;
	}
	const [segmented] = statements;
	if (!segmented || segmented.node_kind !== "segmented_statement") {
		state.stack.pop();
		return null;
	}
	const [firstSegment] = segmented.segments;
	if (!firstSegment || firstSegment.node_kind !== "select_statement") {
		state.stack.pop();
		return null;
	}
	const expanded = expandStatementNode(
		firstSegment,
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
