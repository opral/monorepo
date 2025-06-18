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

export function JSONColumnPlugin(
	jsonColumns: Record<string, string[]>
): KyselyPlugin {
	const jsonColumnNames = Object.keys(jsonColumns).flatMap(
		(key) => jsonColumns[key]!
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
	private readonly jsonbColumns: Record<string, string[]>;
	private readonly table: string | undefined;
	private readonly columns: ReadonlyArray<ColumnNode> | undefined;

	constructor(
		jsonbColumns: Record<string, string[]>,
		table: string | undefined,
		columns: ReadonlyArray<ColumnNode> | undefined
	) {
		super();
		this.jsonbColumns = jsonbColumns;
		this.table = table;
		this.columns = columns;
	}

	private isJsonbColumn(columnName: string): boolean {
		if (!this.table || !columnName) return false;
		return this.jsonbColumns[this.table]?.includes(columnName) ?? false;
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
					// Check if the value part is specifically a ValueNode
					if (valueNode.kind === "ValueNode") {
						// If it is, serialize it
						return {
							...updateItem,
							// @ts-expect-error - kysely type narrowing
							value: this.serializeValue(valueNode),
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
			return {
				...node,
				// @ts-expect-error - kysely type narrowing
				value: this.serializeValue(node.value),
			} as ColumnUpdateNode;
		}
		return super.transformColumnUpdate(node);
	}

	// Support .set("col", value) syntax (SetOperationNode)
	protected override transformSetOperation(node: any): any {
		// node.column.column.name is the column name for SetOperationNode
		const columnName = node.column?.column?.name;
		if (columnName && this.isJsonbColumn(columnName)) {
			return {
				...node,
				value: this.serializeValue(node.value),
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
						return this.serializeValue(valNode);
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
						return this.serializeValue(valNode as ValueNode);
					}
					return valNode;
				});
				return { ...row, values: newValuesList } as ValueListNode;
			}
			return row;
		});
		return { ...node, values: newValues };
	}

	private serializeValue(node: ValueNode): any {
		const val = node.value;
		if (val instanceof ArrayBuffer || ArrayBuffer.isView(val) || val === null) {
			return node;
		}
		const jsonText = JSON.stringify(val);
		return {
			kind: "FunctionNode",
			func: "json",
			arguments: [{ kind: "ValueNode", value: jsonText }],
		};
	}
}
