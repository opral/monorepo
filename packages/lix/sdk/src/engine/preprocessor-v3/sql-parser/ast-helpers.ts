import type {
	ColumnReferenceNode,
	IdentifierNode,
	ObjectNameNode,
	SelectItemNode,
} from "../sql-parser/nodes.js";

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
