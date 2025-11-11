import type {
	SegmentedStatementNode,
	CompoundSelectNode,
	SelectStatementNode,
	SelectItemNode,
	StatementNode,
	StatementSegmentNode,
	TableReferenceNode,
	SubqueryNode,
	WithClauseNode,
	CommonTableExpressionNode,
	IdentifierNode,
} from "../sql-parser/nodes.js";
import { identifier } from "../sql-parser/nodes.js";
import {
	getColumnName,
	getIdentifierValue,
	normalizeIdentifierValue,
} from "../sql-parser/ast-helpers.js";
import { visitStatement, type AstVisitor } from "../sql-parser/visitor.js";
import { parse, normalizeSegmentedStatement } from "../sql-parser/parse.js";
import type { PreprocessorStep, PreprocessorTraceEntry } from "../types.js";
import {
	collectTableColumnUsage,
	resolveRelationAlias,
	type ColumnUsageSummary,
	type TableColumnUsageMap,
} from "../sql-parser/column-usage.js";

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
			if (segment.node_kind === "select_statement") {
				const usage = collectTableColumnUsage(segment);
				const state: ExpandState = {
					stack: [],
					expandedViews: [],
				};

				const expanded = expandStatementNode(segment, views, state, usage);
				if (state.expandedViews.length === 0) {
					return segment;
				}

				expandedViewNames = expandedViewNames.concat(state.expandedViews);
				return expanded;
			}

			if (segment.node_kind === "compound_select") {
				const expanded = expandCompoundSelect(segment, views);
				if (expanded.viewNames.length === 0) {
					return segment;
				}
				expandedViewNames = expandedViewNames.concat(expanded.viewNames);
				return expanded.node;
			}

			return segment;
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

function expandCompoundSelect(
	statement: CompoundSelectNode,
	views: Map<string, ViewDefinition>
): { node: CompoundSelectNode; viewNames: string[] } {
	let viewNames: string[] = [];

	const firstState: ExpandState = { stack: [], expandedViews: [] };
	const firstUsage = collectTableColumnUsage(statement.first);
	const expandedFirst = expandStatementNode(
		statement.first,
		views,
		firstState,
		firstUsage
	) as SelectStatementNode;
	viewNames = viewNames.concat(firstState.expandedViews);

	const expandedBranches = statement.compounds.map((branch) => {
		const branchState: ExpandState = { stack: [], expandedViews: [] };
		const branchUsage = collectTableColumnUsage(branch.select);
		const expandedSelect = expandStatementNode(
			branch.select,
			views,
			branchState,
			branchUsage
		) as SelectStatementNode;
		if (branchState.expandedViews.length === 0) {
			return branch;
		}
		viewNames = viewNames.concat(branchState.expandedViews);
		return {
			...branch,
			select: expandedSelect,
		};
	});

	if (viewNames.length === 0) {
		return { node: statement, viewNames };
	}

	return {
		node: {
			...statement,
			first: expandedFirst,
			compounds: expandedBranches,
		},
		viewNames,
	};
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
	state: ExpandState,
	usage: TableColumnUsageMap
): StatementNode {
	return visitStatement(
		statement,
		createVisitor(views, state, usage, statement)
	);
}

function createVisitor(
	views: Map<string, ViewDefinition>,
	state: ExpandState,
	rootUsage: TableColumnUsageMap,
	rootStatement: StatementNode
): AstVisitor {
	const usageCache = new WeakMap<SelectStatementNode, TableColumnUsageMap>();
	if (rootStatement.node_kind === "select_statement") {
		usageCache.set(rootStatement, rootUsage);
	}
	const selectStack: SelectStatementNode[] = [];
	return {
		select_statement(node) {
			selectStack.push(node);
		},
		select_statement_exit() {
			selectStack.pop();
		},
		table_reference(node) {
			const match = matchView(node, views);
			if (!match) {
				return;
			}

			const currentSelect =
				selectStack[selectStack.length - 1] ??
				(rootStatement.node_kind === "select_statement" ? rootStatement : null);
			let currentUsage: TableColumnUsageMap;
			if (currentSelect) {
				currentUsage =
					usageCache.get(currentSelect) ??
					(currentSelect === rootStatement &&
					rootStatement.node_kind === "select_statement"
						? rootUsage
						: undefined) ??
					collectTableColumnUsage(currentSelect);
				usageCache.set(currentSelect, currentUsage);
			} else {
				currentUsage = rootUsage;
			}
			if (!currentUsage) {
				currentUsage = new Map<string, ColumnUsageSummary>();
			}
			const aliasKey =
				resolveRelationAlias(node) ?? normalizeIdentifierValue(match.name);
			const requirements = currentUsage.get(aliasKey);

			const expanded = expandView(match, views, state, requirements);
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
	state: ExpandState,
	requirements: ColumnUsageSummary | undefined
): SelectStatementNode | CompoundSelectNode | null {
	if (state.stack.includes(view.normalized)) {
		return null;
	}

	state.stack.push(view.normalized);
	try {
		const parsedStatements = parse(view.sql);
		const directStatement = getSingleSelectableStatement(parsedStatements);
		if (directStatement) {
			const pruned = pruneExpandedStatement(directStatement, requirements);
			return expandSelectableStatement(pruned, views, state);
		}

		const body = extractViewBody(view.sql);
		const sanitized = stripSqlComments(body);
		const withParsed = splitWithClause(sanitized);
		if (!withParsed) {
			return null;
		}

		const ctes: CommonTableExpressionNode[] = [];
		for (const cte of withParsed.ctes) {
			const parsedCte = parseSingleSelectableStatement(cte.statementSql);
			if (!parsedCte) {
				return null;
			}
			const expandedCte = expandSelectableStatement(parsedCte, views, state);
			if (!expandedCte || !isSelectableStatement(expandedCte)) {
				return null;
			}
			ctes.push({
				node_kind: "common_table_expression",
				name: createIdentifierNode(cte.name),
				columns: cte.columns.map(createIdentifierNode),
				statement: expandedCte,
			});
		}

		const mainStatement = parseSingleSelectableStatement(withParsed.remainder);
		if (!mainStatement) {
			return null;
		}
		const expandedMain = expandSelectableStatement(mainStatement, views, state);
		if (!expandedMain || !isSelectableStatement(expandedMain)) {
			return null;
		}

		const statementWithWithClause =
			ctes.length === 0 && !withParsed.recursive
				? expandedMain
				: attachWithClause(expandedMain, {
						node_kind: "with_clause",
						recursive: withParsed.recursive,
						ctes,
					});
		if (!statementWithWithClause) {
			return null;
		}
		const pruned = pruneExpandedStatement(
			statementWithWithClause,
			requirements
		);
		return expandSelectableStatement(pruned, views, state);
	} finally {
		state.stack.pop();
	}
}

function expandSelectableStatement(
	statement: SelectStatementNode | CompoundSelectNode,
	views: Map<string, ViewDefinition>,
	state: ExpandState
): SelectStatementNode | CompoundSelectNode | null {
	if (statement.node_kind === "select_statement") {
		const usage = collectTableColumnUsage(statement);
		const expanded = expandStatementNode(statement, views, state, usage);
		return isSelectableStatement(expanded) ? expanded : null;
	}
	const expandedCompound = expandCompoundSelect(statement, views);
	return expandedCompound.node;
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

function getSingleSelectableStatement(
	statements: readonly SegmentedStatementNode[]
): SelectStatementNode | CompoundSelectNode | null {
	if (statements.length !== 1) {
		return null;
	}
	const [segmented] = statements;
	if (!segmented || segmented.node_kind !== "segmented_statement") {
		return null;
	}

	const statementSegments = segmented.segments.filter(
		(segment): segment is StatementNode => segment.node_kind !== "raw_fragment"
	);
	if (statementSegments.length !== 1) {
		return null;
	}

	const [single] = statementSegments;
	if (!single || !isSelectableStatement(single)) {
		return null;
	}
	return single;
}

function isSelectableStatement(
	statement: StatementNode
): statement is SelectStatementNode | CompoundSelectNode {
	return (
		statement.node_kind === "select_statement" ||
		statement.node_kind === "compound_select"
	);
}

function parseSingleSelectableStatement(
	sql: string
): SelectStatementNode | CompoundSelectNode | null {
	const trimmed = stripSqlComments(sql).trim();
	if (trimmed === "") {
		return null;
	}
	const statements = parse(trimmed);
	return getSingleSelectableStatement(statements);
}

function attachWithClause(
	statement: SelectStatementNode | CompoundSelectNode,
	withClause: WithClauseNode
): SelectStatementNode | CompoundSelectNode {
	if (statement.node_kind === "select_statement") {
		const existing = statement.with_clause;
		if (!existing) {
			return {
				...statement,
				with_clause: withClause,
			};
		}
		return {
			...statement,
			with_clause: mergeWithClauses(withClause, existing),
		};
	}

	const existing = statement.with_clause;
	if (!existing) {
		return {
			...statement,
			with_clause: withClause,
		};
	}
	return {
		...statement,
		with_clause: mergeWithClauses(withClause, existing),
	};
}

function pruneExpandedStatement(
	statement: SelectStatementNode | CompoundSelectNode,
	requirements: ColumnUsageSummary | undefined
): SelectStatementNode | CompoundSelectNode {
	if (!requirements || requirements.requiresAllColumns) {
		return statement;
	}
	if (requirements.columns.size === 0) {
		return statement;
	}
	if (statement.node_kind === "select_statement") {
		return pruneSelectProjection(statement, requirements);
	}
	return statement;
}

function pruneSelectProjection(
	statement: SelectStatementNode,
	requirements: ColumnUsageSummary
): SelectStatementNode {
	if (statement.distinct) {
		return statement;
	}
	const neededColumns = requirements.columns;
	let changed = false;
	const filtered = statement.projection.filter((item) => {
		if (item.node_kind !== "select_expression") {
			return true;
		}
		const column = extractProjectedColumnName(item);
		if (!column) {
			return true;
		}
		if (!neededColumns.has(column)) {
			changed = true;
			return false;
		}
		return neededColumns.has(column);
	});
	if (!changed || filtered.length === 0) {
		return statement;
	}
	return {
		...statement,
		projection: filtered,
	};
}

function extractProjectedColumnName(
	item: Extract<SelectItemNode, { node_kind: "select_expression" }>
): string | null {
	const aliasValue = getIdentifierValue(item.alias);
	if (aliasValue) {
		return aliasValue;
	}
	const expression = item.expression;
	if ("sql_text" in expression) {
		return null;
	}
	if (expression.node_kind !== "column_reference") {
		return null;
	}
	return getColumnName(expression);
}

function mergeWithClauses(
	primary: WithClauseNode,
	secondary: WithClauseNode
): WithClauseNode {
	return {
		node_kind: "with_clause",
		recursive: primary.recursive || secondary.recursive,
		ctes: [...primary.ctes, ...secondary.ctes],
	};
}

type ParsedIdentifier = {
	readonly value: string;
	readonly quoted: boolean;
};

type IdentifierParseResult = ParsedIdentifier & {
	readonly end: number;
};

type ParsedCte = {
	readonly name: ParsedIdentifier;
	readonly columns: readonly ParsedIdentifier[];
	readonly statementSql: string;
};

type ParsedWithClause = {
	readonly recursive: boolean;
	readonly ctes: readonly ParsedCte[];
	readonly remainder: string;
};

function createIdentifierNode(parsed: ParsedIdentifier): IdentifierNode {
	return identifier(parsed.value, parsed.quoted);
}

function extractViewBody(sql: string): string {
	const match = sql.match(
		/^\s*CREATE\s+VIEW\s+(?:IF\s+NOT\s+EXISTS\s+)?["\w\.]+\s+AS\s+/i
	);
	if (!match) {
		return sql;
	}
	return sql.slice(match[0]?.length ?? 0);
}

function stripSqlComments(sql: string): string {
	let result = "";
	let index = 0;
	while (index < sql.length) {
		const char = sql[index]!;
		const next = sql[index + 1];

		if (char === "-" && next === "-") {
			index = skipLineComment(sql, index + 2);
			continue;
		}

		if (char === "/" && next === "*") {
			index = skipBlockComment(sql, index + 2);
			continue;
		}

		if (char === "'") {
			const end = skipSingleQuotedString(sql, index);
			result += sql.slice(index, end);
			index = end;
			continue;
		}

		if (char === '"') {
			const end = skipDoubleQuotedIdentifier(sql, index);
			result += sql.slice(index, end);
			index = end;
			continue;
		}

		result += char;
		index += 1;
	}
	return result;
}

function splitWithClause(sql: string): ParsedWithClause | null {
	let index = skipWhitespaceAndComments(sql, 0);
	if (!startsWithKeyword(sql, index, "WITH")) {
		return null;
	}
	index += 4;
	index = skipWhitespaceAndComments(sql, index);

	let recursive = false;
	if (startsWithKeyword(sql, index, "RECURSIVE")) {
		recursive = true;
		index += 9;
		index = skipWhitespaceAndComments(sql, index);
	}

	const ctes: ParsedCte[] = [];
	while (index < sql.length) {
		index = skipWhitespaceAndComments(sql, index);
		const identifierResult = readIdentifier(sql, index);
		if (!identifierResult) {
			return null;
		}
		index = identifierResult.end;

		index = skipWhitespaceAndComments(sql, index);
		let columns: ParsedIdentifier[] = [];
		if (sql[index] === "(") {
			const { content, end } = readParenthesizedContent(sql, index);
			columns = parseColumnList(content);
			index = end;
		}

		index = skipWhitespaceAndComments(sql, index);
		if (!startsWithKeyword(sql, index, "AS")) {
			return null;
		}
		index += 2;
		index = skipWhitespaceAndComments(sql, index);
		if (sql[index] !== "(") {
			return null;
		}

		const { content, end } = readParenthesizedContent(sql, index);
		ctes.push({
			name: {
				value: identifierResult.value,
				quoted: identifierResult.quoted,
			},
			columns,
			statementSql: content.trim(),
		});
		index = end;
		index = skipWhitespaceAndComments(sql, index);

		if (sql[index] === ",") {
			index += 1;
			continue;
		}

		break;
	}

	const remainder = sql.slice(index).trimStart();
	return {
		recursive,
		ctes,
		remainder,
	};
}

function skipWhitespaceAndComments(sql: string, start: number): number {
	let index = start;
	while (index < sql.length) {
		const char = sql[index]!;
		const next = sql[index + 1];

		if (isWhitespaceChar(char)) {
			index += 1;
			continue;
		}

		if (char === "-" && next === "-") {
			index = skipLineComment(sql, index + 2);
			continue;
		}

		if (char === "/" && next === "*") {
			index = skipBlockComment(sql, index + 2);
			continue;
		}

		break;
	}
	return index;
}

function skipLineComment(sql: string, start: number): number {
	let index = start;
	while (index < sql.length) {
		const char = sql[index]!;
		if (char === "\n" || char === "\r") {
			return index + 1;
		}
		index += 1;
	}
	return index;
}

function skipBlockComment(sql: string, start: number): number {
	let index = start;
	while (index < sql.length - 1) {
		if (sql[index] === "*" && sql[index + 1] === "/") {
			return index + 2;
		}
		index += 1;
	}
	return sql.length;
}

function skipSingleQuotedString(sql: string, start: number): number {
	let index = start + 1;
	while (index < sql.length) {
		const char = sql[index]!;
		if (char === "'") {
			if (sql[index + 1] === "'") {
				index += 2;
				continue;
			}
			return index + 1;
		}
		index += 1;
	}
	return sql.length;
}

function skipDoubleQuotedIdentifier(sql: string, start: number): number {
	let index = start + 1;
	while (index < sql.length) {
		const char = sql[index]!;
		if (char === '"') {
			if (sql[index + 1] === '"') {
				index += 2;
				continue;
			}
			return index + 1;
		}
		index += 1;
	}
	return sql.length;
}

function readParenthesizedContent(
	sql: string,
	start: number
): { content: string; end: number } {
	if (sql[start] !== "(") {
		throw new Error("readParenthesizedContent expects '(' at start");
	}

	let index = start + 1;
	let depth = 1;
	const begin = index;

	while (index < sql.length && depth > 0) {
		const char = sql[index]!;
		const next = sql[index + 1];

		if (char === "'") {
			index = skipSingleQuotedString(sql, index);
			continue;
		}

		if (char === '"') {
			index = skipDoubleQuotedIdentifier(sql, index);
			continue;
		}

		if (char === "-" && next === "-") {
			index = skipLineComment(sql, index + 2);
			continue;
		}

		if (char === "/" && next === "*") {
			index = skipBlockComment(sql, index + 2);
			continue;
		}

		if (char === "(") {
			depth += 1;
			index += 1;
			continue;
		}

		if (char === ")") {
			depth -= 1;
			index += 1;
			continue;
		}

		index += 1;
	}

	if (depth !== 0) {
		throw new Error("unterminated parenthesised content in view SQL");
	}

	const content = sql.slice(begin, index - 1);
	return { content, end: index };
}

function readIdentifier(
	sql: string,
	start: number
): IdentifierParseResult | null {
	if (start >= sql.length) {
		return null;
	}

	const first = sql[start]!;
	if (first === '"') {
		const end = skipDoubleQuotedIdentifier(sql, start);
		const value = sql.slice(start + 1, end - 1).replace(/""/g, '"');
		return {
			value,
			quoted: true,
			end,
		};
	}

	if (!isIdentifierStart(first)) {
		return null;
	}

	let index = start + 1;
	while (index < sql.length && isIdentifierPart(sql[index]!)) {
		index += 1;
	}

	return {
		value: sql.slice(start, index),
		quoted: false,
		end: index,
	};
}

function parseColumnList(content: string): ParsedIdentifier[] {
	const columns: ParsedIdentifier[] = [];
	let index = 0;

	while (index < content.length) {
		index = skipWhitespace(content, index);
		if (index >= content.length) {
			break;
		}
		const identifierResult = readIdentifier(content, index);
		if (!identifierResult) {
			break;
		}
		columns.push({
			value: identifierResult.value,
			quoted: identifierResult.quoted,
		});
		index = identifierResult.end;
		index = skipWhitespace(content, index);
		if (content[index] === ",") {
			index += 1;
		}
	}

	return columns;
}

function skipWhitespace(sql: string, start: number): number {
	let index = start;
	while (index < sql.length && isWhitespaceChar(sql[index]!)) {
		index += 1;
	}
	return index;
}

function isIdentifierStart(char: string): boolean {
	return /[A-Za-z_]/.test(char);
}

function isIdentifierPart(char: string | undefined): boolean {
	return char ? /[A-Za-z0-9_]/.test(char) : false;
}

function isWhitespaceChar(char: string): boolean {
	return /\s/.test(char);
}

function startsWithKeyword(
	sql: string,
	start: number,
	keyword: string
): boolean {
	const slice = sql.slice(start, start + keyword.length);
	if (slice.length !== keyword.length) {
		return false;
	}
	if (slice.toLowerCase() !== keyword.toLowerCase()) {
		return false;
	}
	const next = sql[start + keyword.length];
	return !isIdentifierPart(next);
}
