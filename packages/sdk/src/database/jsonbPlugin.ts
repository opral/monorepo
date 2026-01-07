import {
	OperationNodeTransformer,
	sql,
	ValueListNode,
	ValueNode,
	ValuesNode,
	type KyselyPlugin,
	type PluginTransformQueryArgs,
	type PluginTransformResultArgs,
	type QueryResult,
	type RootOperationNode,
	type UnknownRow,
	OnConflictNode,
} from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export class JsonbPlugin implements KyselyPlugin {
	#serializeJsonTransformer = new SerializeJsonbTransformer();
	#database: SqliteWasmDatabase;

	constructor(args: { database: SqliteWasmDatabase }) {
		this.#database = args.database;
	}

	/**
	 * For an outgoing query like insert or update, the JSON
	 * values are transformed into `jsonb` function calls when
	 * executed against the database.
	 */
	transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
		if (
			args.node.kind === "InsertQueryNode" ||
			args.node.kind === "UpdateQueryNode"
		) {
			const result = this.#serializeJsonTransformer.transformNode(args.node);
			return result;
		}
		return args.node;
	}

	/**
	 * For incoming query results, the JSON binaries are parsed
	 * into JSON objects.
	 */
	async transformResult(
		args: PluginTransformResultArgs
	): Promise<QueryResult<UnknownRow>> {
		for (const row of args.result.rows) {
			for (const key in row) {
				const value = row[key];
				// Always try to decode JSONB binary payloads.
				if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
					try {
						const res = this.#database.exec(`SELECT json(?)`, {
							returnValue: "resultRows",
							bind: [value as any],
						});

						row[key] = JSON.parse(res[0] as any);
					} catch {
						// it's not a json binary
					}
					continue;
				}

				// Only parse JSON text for known JSON columns to avoid
				// coercing nested string values that look like JSON.
				if (JSON_COLUMNS.has(key) && typeof value === "string") {
					try {
						row[key] = JSON.parse(value);
					} catch {
						// leave as-is if parsing fails
					}
				}

				if (key === "messages" && Array.isArray(row[key])) {
					row[key] = normalizeMessages(row[key]);
				} else if (key === "variants" && Array.isArray(row[key])) {
					row[key] = normalizeVariants(row[key]);
				}
			}
		}
		return args.result;
	}
}

const JSON_COLUMNS = new Set([
	"declarations",
	"selectors",
	"matches",
	"pattern",
	// jsonArrayFrom results in nested bundle queries
	"messages",
	"variants",
]);

function parseJsonIfString<T>(value: T): T | unknown {
	if (typeof value !== "string") {
		return value;
	}
	try {
		return JSON.parse(value);
	} catch {
		return value;
	}
}

function normalizeVariants(variants: any[]) {
	return variants.map((variant) => {
		if (variant && typeof variant === "object") {
			return {
				...variant,
				matches: parseJsonIfString(variant.matches),
				pattern: parseJsonIfString(variant.pattern),
			};
		}
		return variant;
	});
}

function normalizeMessages(messages: any[]) {
	return messages.map((message) => {
		if (message && typeof message === "object") {
			const normalizedVariants = Array.isArray(message.variants)
				? normalizeVariants(message.variants)
				: parseJsonIfString(message.variants);
			return {
				...message,
				selectors: parseJsonIfString(message.selectors),
				variants: normalizedVariants,
			};
		}
		return message;
	});
}

class SerializeJsonbTransformer extends OperationNodeTransformer {
	protected override transformOnConflict(node: OnConflictNode): OnConflictNode {
		return super.transformOnConflict({
			...node,
			updates: node.updates?.map((updateItem) => {
				if (updateItem.kind !== "ColumnUpdateNode") {
					return updateItem;
				}
				return {
					kind: "ColumnUpdateNode",
					column: updateItem.column,
					// @ts-expect-error - we know that the value is a ValueNode
					value: this.transformValue(updateItem.value),
				};
			}),
		});
	}

	protected override transformValue(node: ValueNode): ValueNode {
		const { value } = node;
		const serializedValue = maybeSerializeJson(value);
		if (value === serializedValue) {
			return node;
		}
		// @ts-expect-error - we know that the node is a ValueNode
		return sql`jsonb(${serializedValue})`.toOperationNode();
	}
	/**
	 * Transforms the value list node by replacing all JSON objects with `jsonb` function calls.
	 */
	protected override transformValueList(node: ValueListNode): ValueListNode {
		return super.transformValueList({
			...node,
			values: node.values.map((listNodeItem) => {
				if (listNodeItem.kind !== "ValueNode") {
					return listNodeItem;
				}
				// @ts-expect-error - we know that the node is a ValueNode
				const { value } = listNodeItem;
				const serializedValue = maybeSerializeJson(value);

				if (value === serializedValue) {
					return listNodeItem;
				}
				return sql`jsonb(${serializedValue})`.toOperationNode();
			}),
		});
	}

	/**
	 * Why this function is needed or why this works remains a mystery.
	 */
	override transformValues(node: ValuesNode): ValuesNode {
		return super.transformValues({
			...node,
			values: node.values.map((valueItemNode) => {
				if (valueItemNode.kind !== "PrimitiveValueListNode") {
					return valueItemNode;
				}

				// change valueItem to ValueListNode
				return {
					kind: "ValueListNode",
					values: valueItemNode.values.map(
						(value) =>
							({
								kind: "ValueNode",
								value,
							}) as ValueNode
					),
				} as ValueListNode;
			}),
		});
	}
}

function maybeSerializeJson(value: any): any {
	if (
		// binary data
		value instanceof ArrayBuffer ||
		// uint8array, etc
		ArrayBuffer.isView(value) ||
		value === null ||
		value === undefined
	) {
		return value;
	} else if (typeof value === "object" || Array.isArray(value)) {
		return JSON.stringify(value);
	}
	return value;
}

// The code here didn't work https://github.com/opral/inlang-sdk/issues/132#issuecomment-2339321910
// but would be the "right" solution to avoid heuristics which column might or might not be a json column
// // modifies the query in place for readability and performance
// function mapQuery(
// 	node: InsertQueryNode,
// 	jsonColumns: TableSchema
// ): InsertQueryNode {
// 	// if the query is not an insert query, we don't need to do anything
// 	if (node.into === undefined) {
// 		return node;
// 	}
// 	// if the table is not in the schema that has json columns, we don't need to do anything
// 	const columnsWithJson = jsonColumns[node.into.table.identifier.name];
// 	if (columnsWithJson === undefined) {
// 		return node;
// 	}
// 	// find the indexes of the values that need to be transformed
// 	// SQL query: INSERT INTO table (col1, col2) VALUES (val1, val2)
// 	const indexesThatNeedToBeTransformed: [number, string][] = [];
// 	for (const [i, col] of node.columns?.entries() ?? []) {
// 		const jsonType = columnsWithJson[col.column.name];
// 		if (jsonType !== undefined) {
// 			indexesThatNeedToBeTransformed.push([i, jsonType]);
// 		}
// 	}
// 	const values = structuredClone(node.values);
// 	for (const [i, jsonType] of indexesThatNeedToBeTransformed) {
// 		if (
// 			// top level values node that should contain a list of values
// 			node.values?.kind !== "ValuesNode" &&
// 			// the node we are interested in must be a value node
// 			// @ts-expect-error - we know that the node is a ValuesNode with values
// 			(node.values as ValuesNode).values?.[i].kind !== "ValueNode"
// 		) {
// 			throw new Error("Unexpected node structure");
// 		}
// 		const serializedJson = JSON.stringify(node.values.values[0].values[i]);
// 		// @ts-expect-error - we know that the node is a ValuesNode with values
// 		values.values[0].values[i] =
// 			jsonType === "jsonb"
// 				? sql`jsonb(${serializedJson})`.toOperationNode()
// 				: sql`json(${serializedJson})`.toOperationNode();
// 	}

// 	return {
// 		...node,
// 		values,
// 	};
// }
