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
	SetClauseNode,
	StatementNode,
	TableReferenceNode,
	UnaryExpressionNode,
	UnaryOperator,
	UpdateStatementNode,
} from "./sql-parser/nodes.js";
import type { SqlNode } from "./sql-parser/nodes.js";
import {
	getBinaryOperatorPrecedence,
	isNonAssociativeBinaryOperator,
} from "./sql-parser/ast-helpers.js";

type CompileResult = {
	sql: string;
	parameters: ReadonlyArray<unknown>;
};

/**
 * Compiles a v3 SQL statement AST back into SQL text.
 *
 * @example
 * ```ts
 * const ast = parse("SELECT 1");
 * const { sql } = compile(ast);
 * ```
 */
export function compile(statement: SqlNode): CompileResult {
	if (statement.node_kind === "raw_fragment") {
		const fragment = statement as RawFragmentNode;
		return {
			sql: fragment.sql_text,
			parameters: [],
		};
	}

	return compileStatement(statement as StatementNode);
}

/**
 * Serialises a single expression node to SQL text.
 *
 * @example
 * ```ts
 * const sql = expressionToSql({ node_kind: "parameter", placeholder: "?" });
 * ```
 */
export function expressionToSql(expression: ExpressionNode): string {
	return emitExpression(expression);
}

function compileStatement(statement: StatementNode): CompileResult {
	switch (statement.node_kind) {
		case "select_statement":
			return buildResult(emitSelectStatement(statement));
		case "insert_statement":
			return buildResult(emitInsertStatement(statement));
		case "update_statement":
			return buildResult(emitUpdateStatement(statement));
		case "delete_statement":
			return buildResult(emitDeleteStatement(statement));
		default:
			throw new Error(
				`Unsupported statement node kind '${statement.node_kind}'`
			);
	}
}

function buildResult(sql: string): CompileResult {
	return {
		sql,
		parameters: [],
	};
}

function emitSelectStatement(statement: SelectStatementNode): string {
	const projectionItems = statement.projection.map(emitSelectItem);
	const selectClause =
		projectionItems.length <= 1
			? `SELECT ${projectionItems[0] ?? ""}`
			: `SELECT\n  ${projectionItems.join(",\n  ")}`;

	const parts = [selectClause];

	if (statement.from_clauses.length) {
		parts.push(`FROM ${statement.from_clauses.map(emitFromClause).join(", ")}`);
	}

	if (statement.where_clause) {
		parts.push(`WHERE ${emitExpressionOrRaw(statement.where_clause)}`);
	}

	if (statement.order_by.length) {
		parts.push(
			`ORDER BY ${statement.order_by.map(emitOrderByItem).join(", ")}`
		);
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
	return `INSERT INTO ${target}${columnSql} ${valuesSql}`;
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
			const sql = emitSelectStatement(relation.statement);
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
		case "raw_fragment":
			return expression.sql_text;
		default:
			return assertNever(expression);
	}
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
	const items = expression.items.map((item) => emitExpression(item)).join(", ");
	const keyword = expression.negated ? "NOT IN" : "IN";
	return `${operand} ${keyword} (${items})`;
}

function emitBetweenExpression(expression: BetweenExpressionNode): string {
	const operand = emitExpression(expression.operand);
	const start = emitExpression(expression.start);
	const end = emitExpression(expression.end);
	const keyword = expression.negated ? "NOT BETWEEN" : "BETWEEN";
	return `${operand} ${keyword} ${start} AND ${end}`;
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
	const escaped = identifier.value.replace(/"/g, '""');
	return `"${escaped}"`;
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
	return parameter.placeholder ?? "?";
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
