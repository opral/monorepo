import {
	ColumnNode,
	ColumnUpdateNode,
	InsertQueryNode,
	OnConflictNode,
	OperationNodeTransformer,
	ValueListNode,
	ValueNode,
	ValuesNode,
	type KyselyPlugin,
	type PluginTransformQueryArgs,
} from "kysely";

type JsonColumnConfig = {
	type: 'object' | Array<'string' | 'number' | 'boolean' | 'object' | 'array' | 'null'>;
};

export function JSONColumnPlugin(
	jsonColumns: Record<string, Record<string, JsonColumnConfig>>
): KyselyPlugin {
	// Build a flat list of all JSON column names for the result transformer
	const jsonColumnNames = Object.keys(jsonColumns).flatMap(
		(table) => Object.keys(jsonColumns[table]!)
	);

	return {
		transformResult: async (args) => {
			for (const row of args.result.rows) {
				for (const col of jsonColumnNames) {
					const text = row[col];
					try {
						row[col] = JSON.parse(text as string);
					} catch {
						continue;
					}
				}
			}

			return args.result;
		},
		transformQuery(args: PluginTransformQueryArgs) {
			if (args.node.kind === "InsertQueryNode") {
				const tableNode = (args.node as InsertQueryNode).into;
				const table =
					tableNode && tableNode.kind === "TableNode"
						? tableNode.table.identifier.name
						: undefined;
				const columns = (args.node as InsertQueryNode).columns;

				const transformer = new SerializeJsonbTransformer(
					jsonColumns,
					table,
					columns
				);
				return transformer.transformNode(args.node);
			}
			if (args.node.kind === "UpdateQueryNode") {
				const tableNode = args.node.table;
				let table: string | undefined = undefined;
				if (tableNode && tableNode.kind === "TableNode") {
					// @ts-expect-error - kysely type narrowing
					table = tableNode.table.identifier.name;
				}

				const transformer = new SerializeJsonbTransformer(
					jsonColumns,
					table,
					undefined
				);
				return transformer.transformNode(args.node);
			}
			return args.node;
		},
	};
}

class SerializeJsonbTransformer extends OperationNodeTransformer {
	private readonly jsonbColumns: Record<string, Record<string, JsonColumnConfig>>;
	private readonly table: string | undefined;
	private readonly columns: ReadonlyArray<ColumnNode> | undefined;

	constructor(
		jsonbColumns: Record<string, Record<string, JsonColumnConfig>>,
		table: string | undefined,
		columns: ReadonlyArray<ColumnNode> | undefined
	) {
		super();
		this.jsonbColumns = jsonbColumns;
		this.table = table;
		this.columns = columns;
	}

	private getJsonColumnConfig(columnName: string): JsonColumnConfig | undefined {
		if (!this.table || !columnName) return undefined;
		return this.jsonbColumns[this.table]?.[columnName];
	}

	private isJsonbColumn(columnName: string): boolean {
		return this.getJsonColumnConfig(columnName) !== undefined;
	}

	private isSqlExpression(node: any): boolean {
		// Check if the node is a SQL expression that shouldn't be wrapped
		// Common SQL expression node types:
		// - RawNode: Created by sql`` template literals
		// - FunctionNode: SQL functions like json_set()
		// - BinaryOperationNode: SQL operations
		// - etc.
		// ValueNode is the only type we want to wrap in json()
		return node && node.kind !== "ValueNode";
	}

	override transformOnConflict(node: OnConflictNode): OnConflictNode {
		if (!node.updates) {
			return node;
		}

		// Map the updates array directly
		const newUpdates = node.updates.map((updateItem) => {
			// Check if it's a ColumnUpdateNode first
			if (updateItem.kind === "ColumnUpdateNode") {
				// @ts-expect-error - kysely type narrowing
				const columnName = updateItem.column.column.name;
				if (this.isJsonbColumn(columnName)) {
					const valueNode = updateItem.value;
					// Check if the value is a SQL expression - if so, don't wrap it
					if (this.isSqlExpression(valueNode)) {
						return updateItem;
					}
					// Check if the value part is specifically a ValueNode
					if (valueNode.kind === "ValueNode") {
						// If it is, serialize it
						return {
							...updateItem,
							// @ts-expect-error - kysely type narrowing
							value: this.serializeValue(valueNode, this.getJsonColumnConfig(columnName)),
						};
					}
				}
			}
			// Return unchanged if not a ColumnUpdateNode or not a JSONB column or value is not ValueNode
			return updateItem;
		});

		// Return a new node with the transformed updates
		return {
			...node,
			updates: newUpdates,
		};
	}

	public override transformNode(node: any): any {
		if (!node) {
			return node;
		}
		return super.transformNode(node);
	}

	// Serialize JSONB values in updates for ColumnUpdateNodes
	protected override transformColumnUpdate(
		node: ColumnUpdateNode
	): ColumnUpdateNode {
		// @ts-expect-error - kysely type narrowing
		const columnName = node.column.column.name;
		if (this.isJsonbColumn(columnName)) {
			// Check if the value is a SQL expression (RawNode, etc.) - if so, don't wrap it
			if (this.isSqlExpression(node.value)) {
				return node;
			}
			return {
				...node,
				// @ts-expect-error - kysely type narrowing
				value: this.serializeValue(node.value, this.getJsonColumnConfig(columnName)),
			} as ColumnUpdateNode;
		}
		return super.transformColumnUpdate(node);
	}

	// Support .set("col", value) syntax (SetOperationNode)
	protected override transformSetOperation(node: any): any {
		// node.column.column.name is the column name for SetOperationNode
		const columnName = node.column?.column?.name;
		if (columnName && this.isJsonbColumn(columnName)) {
			// Check if the value is a SQL expression - if so, don't wrap it
			if (this.isSqlExpression(node.value)) {
				return node;
			}
			return {
				...node,
				value: this.serializeValue(node.value, this.getJsonColumnConfig(columnName)),
			};
		}
		return super.transformSetOperation(node);
	}

	protected override transformValues(node: ValuesNode): ValuesNode {
		const newValues = node.values.map((row) => {
			// Handle literal JS values row
			if (row.kind === "PrimitiveValueListNode") {
				const newValueNodes = row.values.map((val, idx) => {
					const colNode = this.columns?.[idx];
					const valNode: ValueNode = { kind: "ValueNode", value: val };
					if (
						colNode?.kind === "ColumnNode" &&
						this.isJsonbColumn(colNode.column.name)
					) {
						const config = this.getJsonColumnConfig(colNode.column.name);
						return this.serializeValue(valNode, config);
					}
					return valNode;
				});
				return {
					kind: "ValueListNode",
					values: newValueNodes,
				} as ValueListNode;
			}
			// Handle AST rows
			if (row.kind === "ValueListNode") {
				const newValuesList = row.values.map((valNode, idx) => {
					const colNode = this.columns?.[idx];
					if (
						colNode?.kind === "ColumnNode" &&
						this.isJsonbColumn(colNode.column.name)
					) {
						const config = this.getJsonColumnConfig(colNode.column.name);
						return this.serializeValue(valNode as ValueNode, config);
					}
					return valNode;
				});
				return { ...row, values: newValuesList } as ValueListNode;
			}
			return row;
		});
		return { ...node, values: newValues };
	}

	private serializeValue(node: ValueNode, config?: JsonColumnConfig): any {
		const val = node.value;
		if (val instanceof ArrayBuffer || ArrayBuffer.isView(val) || val === null) {
			return node;
		}
		
		// Check if this column only accepts objects and we have a string
		// that might be pre-serialized JSON
		if (config?.type === 'object' && typeof val === 'string') {
			// For object-only columns, assume string values are pre-serialized JSON
			// to avoid double serialization
			return {
				kind: "FunctionNode",
				func: "json",
				arguments: [{ kind: "ValueNode", value: val }],
			};
		}
		
		// For all other cases, stringify the value
		const jsonText = JSON.stringify(val);
		
		return {
			kind: "FunctionNode",
			func: "json",
			arguments: [{ kind: "ValueNode", value: jsonText }],
		};
	}
}
