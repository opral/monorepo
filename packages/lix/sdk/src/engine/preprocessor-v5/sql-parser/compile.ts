import type {
	BetweenExpressionNode,
	BinaryExpressionNode,
	BinaryOperator,
	ColumnReferenceNode,
	DeleteStatementNode,
	ExpressionNode,
	FromClauseNode,
	InsertStatementNode,
	InsertValuesNode,
	OnConflictActionNode,
	OnConflictClauseNode,
	OnConflictTargetNode,
	IdentifierNode,
	InListExpressionNode,
	JoinClauseNode,
	JoinType,
	LiteralNode,
	ObjectNameNode,
	OrderByItemNode,
	ParameterExpressionNode,
	RawFragmentNode,
	SelectItemNode,
	SelectStatementNode,
	CompoundSelectNode,
	CompoundOperator,
	SegmentedStatementNode,
	SetClauseNode,
	StatementNode,
	StatementSegmentNode,
	TableReferenceNode,
	UnaryExpressionNode,
	UnaryOperator,
	UpdateStatementNode,
	FunctionCallExpressionNode,
	SubqueryExpressionNode,
	WithClauseNode,
	CommonTableExpressionNode,
	CaseExpressionNode,
} from "./nodes.js";
import {
	getBinaryOperatorPrecedence,
	isNonAssociativeBinaryOperator,
} from "./ast-helpers.js";

const RESERVED_KEYWORDS = new Set(
	[
		"add",
		"all",
		"alter",
		"and",
		"as",
		"asc",
		"between",
		"by",
		"case",
		"check",
		"commit",
		"constraint",
		"create",
		"default",
		"delete",
		"desc",
		"distinct",
		"drop",
		"else",
		"end",
		"except",
		"exists",
		"from",
		"group",
		"having",
		"in",
		"index",
		"inner",
		"insert",
		"intersect",
		"into",
		"is",
		"join",
		"left",
		"limit",
		"not",
		"null",
		"offset",
		"on",
		"or",
		"order",
		"outer",
		"primary",
		"recursive",
		"references",
		"select",
		"set",
		"table",
		"then",
		"union",
		"unique",
		"update",
		"using",
		"values",
		"view",
		"when",
		"where",
		"with",
	].map((keyword) => keyword.toLowerCase())
);

type CompileResult = {
	sql: string;
	parameters: ReadonlyArray<unknown>;
};

/**
 * Compiles segmented statements back into SQL text.
 *
 * @example
 * ```ts
 * const ast = parse("SELECT 1");
 * const { sql } = compile(ast);
 * ```
 */
export function compile(
	statements: readonly SegmentedStatementNode[]
): CompileResult {
	const sql = statements.map(emitSegmentedStatement).join("\n");
	return {
		sql,
		parameters: [],
	};
}

/**
 * Serialises a single expression node to SQL text.
 *
 * @example
 * ```ts
 * const sql = expressionToSql({
 *   node_kind: "parameter",
 *   placeholder: "?",
 *   position: 0,
 * });
 * ```
 */
export function expressionToSql(expression: ExpressionNode): string {
	return emitExpression(expression);
}

function compileStatement(statement: StatementNode): CompileResult {
	const kind = statement.node_kind;
	switch (kind) {
		case "compound_select":
			return buildResult(emitCompoundSelect(statement));
		case "select_statement":
			return buildResult(emitSelectStatement(statement));
		case "insert_statement":
			return buildResult(emitInsertStatement(statement));
		case "update_statement":
			return buildResult(emitUpdateStatement(statement));
		case "delete_statement":
			return buildResult(emitDeleteStatement(statement));
		default:
			throw new Error(`Unsupported statement node kind '${kind}'`);
	}
}

function buildResult(sql: string): CompileResult {
	return {
		sql,
		parameters: [],
	};
}

/**
 * Serialises a sequence of SQL segments back into a single SQL string.
 *
 * @example
 * ```ts
 * const sql = emitStatementSequence(node);
 * ```
 */
function emitSegmentedStatement(statement: SegmentedStatementNode): string {
	let sql = "";
	for (const segment of statement.segments as readonly StatementSegmentNode[]) {
		const segmentSql = isRawFragment(segment)
			? segment.sql_text
			: compileStatement(segment).sql;

		if (!segmentSql) {
			continue;
		}

		if (sql) {
			const lastChar = getLastCharacter(sql);
			const firstChar = getFirstCharacter(segmentSql);
			if (
				lastChar &&
				firstChar &&
				!isWhitespace(lastChar) &&
				!isWhitespace(firstChar)
			) {
				sql += "\n";
			}
		}

		sql += segmentSql;
	}
	return sql;
}

function getFirstCharacter(value: string): string | null {
	for (let index = 0; index < value.length; index += 1) {
		const char = value[index];
		if (char !== undefined) {
			return char;
		}
	}
	return null;
}

function getLastCharacter(value: string): string | null {
	for (let index = value.length - 1; index >= 0; index -= 1) {
		const char = value[index];
		if (char !== undefined) {
			return char;
		}
	}
	return null;
}

function isWhitespace(char: string): boolean {
	return /\s/.test(char);
}

function isRawFragment(
	segment: StatementSegmentNode
): segment is RawFragmentNode {
	return segment.node_kind === "raw_fragment";
}

function emitCompoundSelect(statement: CompoundSelectNode): string {
	const segments: string[] = [];
	segments.push(emitSelectStatement(statement.first));
	for (const branch of statement.compounds) {
		segments.push(
			`${emitCompoundOperator(branch.operator)}\n${emitSelectStatement(branch.select)}`
		);
	}

	const parts: string[] = [];
	const withClauseSql = emitWithClause(statement.with_clause);
	if (withClauseSql) {
		parts.push(withClauseSql);
	}
	parts.push(segments.join("\n"));

	if (statement.order_by.length) {
		parts.push(
			`ORDER BY ${statement.order_by
				.map((item) => emitOrderByItem(item))
				.join(", ")}`
		);
	}

	if (statement.limit) {
		parts.push(`LIMIT ${emitExpressionOrRaw(statement.limit)}`);
	}

	if (statement.offset) {
		parts.push(`OFFSET ${emitExpressionOrRaw(statement.offset)}`);
	}

	return parts.join("\n");
}

function emitCompoundOperator(operator: CompoundOperator): string {
	switch (operator) {
		case "union":
			return "UNION";
		case "union_all":
			return "UNION ALL";
		case "intersect":
			return "INTERSECT";
		case "except":
			return "EXCEPT";
		default:
			return assertNever(operator);
	}
}

function emitWithClause(withClause: WithClauseNode | null): string | null {
	if (!withClause || withClause.ctes.length === 0) {
		return null;
	}
	const prefix = withClause.recursive ? "WITH RECURSIVE" : "WITH";
	const ctesSql = withClause.ctes
		.map((cte) => emitCommonTableExpression(cte))
		.join(",\n");
	return `${prefix} ${ctesSql}`;
}

function emitCommonTableExpression(cte: CommonTableExpressionNode): string {
	const name = emitIdentifier(cte.name);
	const columnsSql = cte.columns.length
		? `(${cte.columns.map((column) => emitIdentifier(column)).join(", ")})`
		: "";
	const statementSql = compileStatement(cte.statement).sql;
	const indentedStatement = indentSql(statementSql);
	const nameWithColumns = `${name}${columnsSql}`;
	return `${nameWithColumns} AS (\n${indentedStatement}\n)`;
}

function indentSql(sql: string): string {
	return sql
		.split("\n")
		.map((line) => (line.length > 0 ? `  ${line}` : line))
		.join("\n");
}

function emitSelectStatement(statement: SelectStatementNode): string {
	const parts: string[] = [];
	const withClauseSql = emitWithClause(statement.with_clause);
	if (withClauseSql) {
		parts.push(withClauseSql);
	}
	const projectionItems = statement.projection.map(emitSelectItem);
	const selectKeyword = statement.distinct ? "SELECT DISTINCT" : "SELECT";
	const selectClause =
		projectionItems.length <= 1
			? `${selectKeyword} ${projectionItems[0] ?? ""}`
			: `${selectKeyword}\n  ${projectionItems.join(",\n  ")}`;

	parts.push(selectClause);

	if (statement.from_clauses.length) {
		parts.push(`FROM ${statement.from_clauses.map(emitFromClause).join(", ")}`);
	}

	if (statement.where_clause) {
		parts.push(`WHERE ${emitExpressionOrRaw(statement.where_clause)}`);
	}

	if (statement.group_by.length) {
		parts.push(
			`GROUP BY ${statement.group_by.map((expr) => emitExpression(expr)).join(", ")}`
		);
	}

	if (statement.order_by.length) {
		parts.push(
			`ORDER BY ${statement.order_by.map(emitOrderByItem).join(", ")}`
		);
	}

	if (statement.limit) {
		parts.push(`LIMIT ${emitExpressionOrRaw(statement.limit)}`);
	}

	if (statement.offset) {
		parts.push(`OFFSET ${emitExpressionOrRaw(statement.offset)}`);
	}

	return parts.join("\n");
}

function emitUpdateStatement(statement: UpdateStatementNode): string {
	const target = emitTableReference(statement.target);
	const assignments = statement.assignments
		.map((assignment) => emitSetClause(assignment))
		.join(", ");
	const whereSql = statement.where_clause
		? " WHERE " + emitExpressionOrRaw(statement.where_clause)
		: "";
	return `UPDATE ${target} SET ${assignments}${whereSql}`;
}

function emitDeleteStatement(statement: DeleteStatementNode): string {
	const target = emitTableReference(statement.target);
	const whereSql = statement.where_clause
		? " WHERE " + emitExpressionOrRaw(statement.where_clause)
		: "";
	return `DELETE FROM ${target}${whereSql}`;
}

function emitInsertStatement(statement: InsertStatementNode): string {
	const target = emitObjectName(statement.target);
	const columnSql = statement.columns.length
		? ` (${statement.columns.map((column) => emitIdentifier(column)).join(", ")})`
		: "";
	const valuesSql = emitInsertValues(statement.source);
	const conflictSql = statement.on_conflict
		? ` ${emitOnConflictClause(statement.on_conflict)}`
		: "";
	return `INSERT INTO ${target}${columnSql} ${valuesSql}${conflictSql}`;
}

function emitInsertValues(values: InsertValuesNode): string {
	const rows = values.rows.map((row) => {
		const expressions = row.map((expression) => emitExpression(expression));
		return `(${expressions.join(", ")})`;
	});
	if (rows.length <= 1) {
		return `VALUES ${rows[0] ?? "()"}`;
	}
	return `VALUES\n  ${rows.join(",\n  ")}`;
}

function emitOnConflictClause(clause: OnConflictClauseNode): string {
	const targetSql = clause.target ? emitOnConflictTarget(clause.target) : "";
	const actionSql = emitOnConflictAction(clause.action);
	return targetSql
		? `ON CONFLICT ${targetSql} ${actionSql}`
		: `ON CONFLICT ${actionSql}`;
}

function emitOnConflictTarget(target: OnConflictTargetNode): string {
	const expressionsSql = target.expressions
		.map((expression) => emitExpressionOrRaw(expression))
		.join(", ");
	const whereSql = target.where
		? ` WHERE ${emitExpressionOrRaw(target.where)}`
		: "";
	if (expressionsSql) {
		return `(${expressionsSql})${whereSql}`;
	}
	return whereSql ? whereSql.trimStart() : "";
}

function emitOnConflictAction(action: OnConflictActionNode): string {
	switch (action.node_kind) {
		case "on_conflict_do_nothing":
			return "DO NOTHING";
		case "on_conflict_do_update": {
			const assignments = action.assignments
				.map((assignment) => emitSetClause(assignment))
				.join(", ");
			const whereSql = action.where
				? ` WHERE ${emitExpressionOrRaw(action.where)}`
				: "";
			return `DO UPDATE SET ${assignments}${whereSql}`;
		}
		default:
			return assertNever(action);
	}
}

function emitSelectItem(item: SelectItemNode): string {
	switch (item.node_kind) {
		case "select_star":
			return "*";
		case "select_qualified_star":
			return `${emitIdentifierPath(item.qualifier)}.*`;
		case "select_expression": {
			const expressionSql = emitExpression(item.expression);
			if (item.alias) {
				return `${expressionSql} AS ${emitIdentifier(item.alias)}`;
			}
			return expressionSql;
		}
		default:
			return assertNever(item);
	}
}

function emitFromClause(clause: FromClauseNode): string {
	const relation = emitRelation(clause.relation);
	const joins = clause.joins.map((join) => emitJoinClause(join)).join(" ");
	return joins ? `${relation} ${joins}` : relation;
}

function emitJoinClause(join: JoinClauseNode): string {
	const relation = emitRelation(join.relation);
	const joinKeyword = formatJoinType(join.join_type);
	if (!join.on_expression) {
		return `${joinKeyword} ${relation}`;
	}
	const onSql = emitExpressionOrRaw(join.on_expression);
	return `${joinKeyword} ${relation} ON ${onSql}`;
}

function formatJoinType(type: JoinType): string {
	switch (type) {
		case "inner":
			return "INNER JOIN";
		case "left":
			return "LEFT JOIN";
		case "right":
			return "RIGHT JOIN";
		case "full":
			return "FULL JOIN";
		default:
			return "JOIN";
	}
}

function emitRelation(
	relation: SelectStatementNode["from_clauses"][number]["relation"]
): string {
	switch (relation.node_kind) {
		case "table_reference": {
			const name = emitObjectName(relation.name);
			if (relation.alias) {
				return `${name} AS ${emitIdentifier(relation.alias)}`;
			}
			return name;
		}
		case "subquery": {
			const sql = compileStatement(relation.statement).sql;
			return `(${sql}) AS ${emitIdentifier(relation.alias)}`;
		}
		case "raw_fragment":
			return relation.sql_text;
		default:
			return assertNever(relation);
	}
}

function emitTableReference(reference: TableReferenceNode): string {
	const name = emitObjectName(reference.name);
	if (reference.alias) {
		return `${name} AS ${emitIdentifier(reference.alias)}`;
	}
	return name;
}

function emitExpressionOrRaw(
	expression: ExpressionNode | RawFragmentNode
): string {
	if (expression.node_kind === "raw_fragment") {
		return expression.sql_text;
	}
	return emitExpression(expression);
}

type ParentContext =
	| { kind: "binary"; operator: BinaryOperator; position: "left" | "right" }
	| { kind: "unary"; operator: UnaryOperator };

function emitExpression(
	expression: ExpressionNode,
	parent?: ParentContext
): string {
	const sql = emitExpressionWithoutParent(expression);
	if (shouldWrapExpression(expression, parent)) {
		return `(${sql})`;
	}
	return sql;
}

function emitExpressionWithoutParent(expression: ExpressionNode): string {
	switch (expression.node_kind) {
		case "column_reference":
			return emitColumnReference(expression);
		case "literal":
			return emitLiteral(expression);
		case "parameter":
			return emitParameter(expression);
		case "grouped_expression":
			return `(${emitExpression(expression.expression)})`;
		case "binary_expression":
			return emitBinaryExpression(expression);
		case "unary_expression":
			return emitUnaryExpression(expression);
		case "in_list_expression":
			return emitInListExpression(expression);
		case "between_expression":
			return emitBetweenExpression(expression);
		case "function_call":
			return emitFunctionCall(expression);
		case "subquery_expression":
			return emitSubqueryExpression(expression);
		case "case_expression":
			return emitCaseExpression(expression);
		case "raw_fragment":
			return expression.sql_text;
		default:
			return assertNever(expression);
	}
}

function emitCaseExpression(expression: CaseExpressionNode): string {
	const parts: string[] = ["CASE"];
	if (expression.operand) {
		parts.push(emitExpression(expression.operand));
	}
	for (const branch of expression.branches) {
		parts.push(
			`WHEN ${emitExpression(branch.condition)} THEN ${emitExpression(branch.result)}`
		);
	}
	if (expression.else_result) {
		parts.push(`ELSE ${emitExpression(expression.else_result)}`);
	}
	parts.push("END");
	return parts.join(" ");
}

function emitBinaryExpression(expression: BinaryExpressionNode): string {
	const left = emitExpression(expression.left, {
		kind: "binary",
		operator: expression.operator,
		position: "left",
	});
	const right = emitExpression(expression.right, {
		kind: "binary",
		operator: expression.operator,
		position: "right",
	});
	return `${left} ${formatBinaryOperator(expression.operator)} ${right}`;
}

function emitUnaryExpression(expression: UnaryExpressionNode): string {
	const operand = emitExpression(expression.operand, {
		kind: "unary",
		operator: expression.operator,
	});
	if (expression.operator === "minus") {
		return `-${operand}`;
	}
	return `NOT ${operand}`;
}

function emitInListExpression(expression: InListExpressionNode): string {
	const operand = emitExpression(expression.operand);
	const keyword = expression.negated ? "NOT IN" : "IN";

	if (expression.items.length === 1) {
		const single = expression.items[0]!;
		const innerSql =
			single.node_kind === "subquery_expression"
				? compileStatement(single.statement).sql
				: emitExpression(single);
		return `${operand} ${keyword} (${innerSql})`;
	}

	const items = expression.items.map((item) => emitExpression(item)).join(", ");
	return `${operand} ${keyword} (${items})`;
}

function emitBetweenExpression(expression: BetweenExpressionNode): string {
	const operand = emitExpression(expression.operand);
	const start = emitExpression(expression.start);
	const end = emitExpression(expression.end);
	const keyword = expression.negated ? "NOT BETWEEN" : "BETWEEN";
	return `${operand} ${keyword} ${start} AND ${end}`;
}

function emitFunctionCall(expression: FunctionCallExpressionNode): string {
	const name = emitIdentifier(expression.name);
	const args = expression.arguments.map((argument) => emitExpression(argument));
	return `${name}(${args.join(", ")})`;
}

function emitSubqueryExpression(expression: SubqueryExpressionNode): string {
	const inner = compileStatement(expression.statement).sql;
	return `(${inner})`;
}

function emitOrderByItem(item: OrderByItemNode): string {
	const expressionSql = emitExpression(item.expression);
	if (!item.direction) {
		return expressionSql;
	}
	return `${expressionSql} ${item.direction.toUpperCase()}`;
}

function emitSetClause(clause: SetClauseNode): string {
	const column = emitColumnReference(clause.column);
	const value = emitExpression(clause.value);
	return `${column} = ${value}`;
}

function emitColumnReference(reference: ColumnReferenceNode): string {
	return emitIdentifierPath(reference.path);
}

function emitObjectName(name: ObjectNameNode): string {
	return emitIdentifierPath(name.parts);
}

function emitIdentifierPath(path: readonly IdentifierNode[]): string {
	return path.map((identifier) => emitIdentifier(identifier)).join(".");
}

function emitIdentifier(identifier: IdentifierNode): string {
	const value = identifier.value;
	if (
		identifier.quoted ||
		!/^[A-Za-z_][A-Za-z0-9_]*$/.test(value) ||
		RESERVED_KEYWORDS.has(value.toLowerCase())
	) {
		const escaped = value.replace(/"/g, '""');
		return `"${escaped}"`;
	}
	return value;
}

function emitLiteral(literal: LiteralNode): string {
	const { value } = literal;
	if (value === null) {
		return "NULL";
	}
	switch (typeof value) {
		case "number":
			return Number.isFinite(value) ? String(value) : "NULL";
		case "boolean":
			return value ? "TRUE" : "FALSE";
		case "string":
			return `'${value.replace(/'/g, "''")}'`;
		default:
			return `'${String(value).replace(/'/g, "''")}'`;
	}
}

function emitParameter(parameter: ParameterExpressionNode): string {
	const placeholder = parameter.placeholder ?? "?";
	return placeholder === "" ? "?" : placeholder;
}

function shouldWrapExpression(
	expression: ExpressionNode,
	parent?: ParentContext
): boolean {
	if (!parent) {
		return false;
	}

	if (expression.node_kind === "grouped_expression") {
		return false;
	}

	if (parent.kind === "binary") {
		if (expression.node_kind !== "binary_expression") {
			return false;
		}
		const parentPrecedence = getBinaryOperatorPrecedence(parent.operator);
		const currentPrecedence = getBinaryOperatorPrecedence(expression.operator);
		if (currentPrecedence < parentPrecedence) {
			return true;
		}
		if (currentPrecedence === parentPrecedence) {
			if (
				parent.position === "right" &&
				isNonAssociativeBinaryOperator(parent.operator)
			) {
				return true;
			}
		}
		return false;
	}

	if (parent.kind === "unary") {
		if (parent.operator === "minus") {
			return expression.node_kind === "binary_expression";
		}
		if (parent.operator === "not") {
			return (
				expression.node_kind === "binary_expression" ||
				expression.node_kind === "between_expression" ||
				expression.node_kind === "in_list_expression"
			);
		}
	}

	return false;
}

function formatBinaryOperator(operator: BinaryOperator): string {
	switch (operator) {
		case "or":
			return "OR";
		case "and":
			return "AND";
		case "not_like":
			return "NOT LIKE";
		case "is_not":
			return "IS NOT";
		case "like":
			return "LIKE";
		case "is":
			return "IS";
		default:
			return operator;
	}
}

function assertNever(value: never): never {
	throw new Error(`Unexpected node kind: ${JSON.stringify(value)}`);
}
