import type { OperationNode } from "kysely";

/**
 * Extracts the table identifier from an operation node if it represents a
 * table reference (optionally wrapped in an alias).
 *
 * @example
 * const table = extractTableName(tableNode);
 */
export function extractTableName(
	node: OperationNode | undefined
): string | undefined {
	if (!node) return undefined;

	switch (node.kind) {
		case "TableNode": {
			const identifier = (node as any).table?.identifier;
			return identifier?.name;
		}
		case "AliasNode": {
			return extractTableName((node as any).node);
		}
		default:
			return undefined;
	}
}

/**
 * Derives the column identifier from a column or reference node.
 *
 * @example
 * const column = extractColumnName(reference.column);
 */
export function extractColumnName(
	node: OperationNode | undefined
): string | undefined {
	if (!node) return undefined;

	switch (node.kind) {
		case "ReferenceNode":
			return extractColumnName((node as any).column);
		case "ColumnNode":
			return (node as any).column?.name;
		default:
			return undefined;
	}
}

/**
 * Collects literal values from a value/node tree (including IN lists and raw
 * fragments with parameters).
 *
 * @example
 * const [first] = extractValues(binary.rightOperand);
 */
export function extractValues(node: OperationNode | undefined): unknown[] {
	if (!node) return [];

	switch (node.kind) {
		case "ValueNode":
			return [(node as any).value];
		case "PrimitiveValueListNode":
			return [...(((node as any).values as unknown[]) ?? [])];
		case "ValueListNode":
			return (((node as any).values as OperationNode[]) ?? []).flatMap(
				(valueNode) => extractValues(valueNode)
			);
		case "RawNode": {
			const parameters = (node as any).parameters ?? [];
			return parameters.flatMap((param: OperationNode) => extractValues(param));
		}
		default:
			return [];
	}
}
