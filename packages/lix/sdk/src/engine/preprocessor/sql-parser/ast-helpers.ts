import type {
	BinaryOperator,
	ColumnReferenceNode,
	ExpressionNode,
	IdentifierNode,
	LiteralNode,
	ObjectNameNode,
	RawFragmentNode,
	SelectItemNode,
} from "./nodes.js";

/**
 * Retrieves the string value from an identifier node.
 *
 * @example
 * ```ts
 * const value = getIdentifierValue(identifier("example"));
 * ```
 */
export function getIdentifierValue(
	identifierNode: IdentifierNode | null | undefined
): string | null {
	return identifierNode?.value ?? null;
}

/**
 * Checks whether an object name matches the expected table name.
 *
 * @example
 * ```ts
 * if (objectNameMatches(table.name, "projects")) {
 *   // ...
 * }
 * ```
 */
export function objectNameMatches(
	objectName: ObjectNameNode,
	expected: string
): boolean {
	if (objectName.parts.length === 0) {
		return false;
	}
	const last = objectName.parts[objectName.parts.length - 1]!;
	return (
		normalizeIdentifierValue(last.value) === normalizeIdentifierValue(expected)
	);
}

/**
 * Determines whether the provided select item represents a `target.*` pattern
 * for one of the tracked table names.
 *
 * @example
 * ```ts
 * if (isSelectAllForTable(item, tableNames)) {
 *   // ...
 * }
 * ```
 */
export function isSelectAllForTable(
	item: SelectItemNode,
	tableNames: Set<string>
): boolean {
	if (item.node_kind === "select_star") {
		return true;
	}
	if (item.node_kind !== "select_qualified_star") {
		return false;
	}
	if (item.qualifier.length === 0) {
		return false;
	}
	const qualifier = item.qualifier[item.qualifier.length - 1]!;
	return tableNames.has(normalizeIdentifierValue(qualifier.value));
}

/**
 * Extracts the qualifier (table or alias) from a column reference if present.
 *
 * @example
 * ```ts
 * const qualifier = getColumnQualifier(columnReference);
 * ```
 */
export function getColumnQualifier(column: ColumnReferenceNode): string | null {
	if (column.path.length <= 1) {
		return null;
	}
	const qualifier = column.path[column.path.length - 2]!;
	return normalizeIdentifierValue(qualifier.value);
}

/**
 * Extracts the column name from a column reference.
 *
 * @example
 * ```ts
 * const columnName = getColumnName(columnReference);
 * ```
 */
export function getColumnName(column: ColumnReferenceNode): string {
	const terminal = column.path[column.path.length - 1];
	if (!terminal) {
		throw new Error("column reference is missing its terminal identifier");
	}
	return terminal.value;
}

/**
 * Collects the path components of a column reference.
 *
 * @example
 * ```ts
 * const parts = getColumnPath(columnReference);
 * ```
 */
export function getColumnPath(
	column: ColumnReferenceNode,
	options?: { normalize?: boolean }
): string[] {
	return column.path.map((identifier) =>
		options?.normalize
			? normalizeIdentifierValue(identifier.value)
			: identifier.value
	);
}

/**
 * Escapes single quotes in a string so it can be safely used as an SQL literal.
 *
 * @example
 * ```ts
 * sqlStringLiteral("O'Reilly"); // returns 'O''Reilly'
 * ```
 */
export function sqlStringLiteral(value: string): string {
	return `'${value.replace(/'/g, "''")}'`;
}

/**
 * Determines whether an expression is a literal node.
 *
 * @example
 * ```ts
 * if (isLiteralExpression(expression)) {
 *   console.log(expression.value);
 * }
 * ```
 */
export function isLiteralExpression(
	expression: ExpressionNode | RawFragmentNode
): expression is LiteralNode {
	if ("sql_text" in expression) {
		return false;
	}
	return expression.node_kind === "literal";
}

/**
 * Provides the SQL precedence ranking for binary operators.
 *
 * @example
 * ```ts
 * const precedence = getBinaryOperatorPrecedence("and");
 * ```
 */
export function getBinaryOperatorPrecedence(operator: BinaryOperator): number {
	switch (operator) {
		case "or":
			return 1;
		case "and":
			return 2;
		case "=":
		case "!=":
		case "<>":
		case ">":
		case ">=":
		case "<":
		case "<=":
		case "like":
		case "not_like":
		case "match":
		case "glob":
		case "regexp":
		case "is":
		case "is_not":
			return 3;
		case "+":
		case "-":
			return 4;
		case "*":
		case "/":
		case "%":
			return 5;
		case "||":
		case "->":
		case "->>":
			return 6;
		default:
			return 0;
	}
}

/**
 * Identifies operators that are not associative and must preserve ordering.
 *
 * @example
 * ```ts
 * if (isNonAssociativeBinaryOperator("-")) { ... }
 * ```
 */
export function isNonAssociativeBinaryOperator(
	operator: BinaryOperator
): boolean {
	switch (operator) {
		case "-":
		case "/":
		case "%":
			return true;
		default:
			return false;
	}
}

/**
 * Normalizes identifier casing to simplify comparisons.
 *
 * @example
 * ```ts
 * const normalized = normalizeIdentifierValue("FoO");
 * ```
 */
export function normalizeIdentifierValue(value: string): string {
	return value.toLowerCase();
}
