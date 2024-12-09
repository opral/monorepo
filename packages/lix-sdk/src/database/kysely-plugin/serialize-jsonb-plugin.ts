import {
	OnConflictNode,
	OperationNodeTransformer,
	sql,
	ValueListNode,
	ValueNode,
	ValuesNode,
	type KyselyPlugin,
} from "kysely";

export function SerializeJsonBPlugin(): KyselyPlugin {
	const parseJsonTransformer = new SerializeJsonbTransformer();

	return {
		transformResult: async (args) => args.result,
		transformQuery(args) {
			if (
				args.node.kind === "InsertQueryNode" ||
				args.node.kind === "UpdateQueryNode"
			) {
				const result = parseJsonTransformer.transformNode(args.node);

				return result;
			}
			return args.node;
		},
	};
}

class SerializeJsonbTransformer extends OperationNodeTransformer {
	override transformOnConflict(node: OnConflictNode): OnConflictNode {
		return super.transformOnConflict({
			...node,
			updates: node.updates?.map((updateItem) => {
				if (updateItem.kind !== "ColumnUpdateNode") {
					return updateItem;
				}
				return {
					kind: "ColumnUpdateNode",
					column: updateItem.column,
					value: this.transformValue(
						// @ts-expect-error - type mismatch
						updateItem.value
					),
				};
			}),
		});
	}

	override transformValue(node: ValueNode): ValueNode {
		const { value } = node;
		const serializedValue = maybeSerializeJson(value);
		if (value === serializedValue) {
			return node;
		}
		// @ts-expect-error - type mismatch
		return sql`jsonb(${serializedValue})`.toOperationNode();
	}
	/**
	 * Transforms the value list node by replacing all JSON objects with `jsonb` function calls.
	 */
	override transformValueList(node: ValueListNode): ValueListNode {
		return super.transformValueList({
			...node,
			values: node.values.map((listNodeItem) => {
				if (listNodeItem.kind !== "ValueNode") {
					return listNodeItem;
				}
				// @ts-expect-error - type mismatch
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
	 * changes PrimitiveValueListNode to ValueListNode to allow kysely to process objects
	 */
	override transformValues(node: ValuesNode): ValuesNode {
		return super.transformValues({
			...node,
			values: node.values.map((valueItemNode) => {
				if (valueItemNode.kind !== "PrimitiveValueListNode") {
					return valueItemNode;
				}

				// change PrimitiveValueListNode to ValueListNode
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
