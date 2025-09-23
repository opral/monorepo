import { type OperationNode, type RootOperationNode } from "kysely";
import { extractTableName } from "../operation-node-utils.js";
import { buildStateSelect, collectSchemaFilters } from "./state.js";

const STATE_ALL_VIEW = "state_all";

export function rewriteStateAllView(
	node: RootOperationNode
): RootOperationNode {
	if (node.kind !== "SelectQueryNode") {
		return node;
	}

	let changed = false;

	const rewriteFromItem = (fromItem: OperationNode): OperationNode => {
		const aliasInfo = analyzeFromItem(fromItem);
		if (!aliasInfo) {
			return fromItem;
		}

		const schemaKeys = collectSchemaFilters(
			node.where?.where,
			aliasInfo.alias,
			STATE_ALL_VIEW
		);

		changed = true;
		return buildStateSelect({
			alias: aliasInfo.alias,
			schemaKeys,
			restrictToActiveVersion: false,
			rewriteStateAll: false,
		});
	};

	const rewrittenFroms = node.from?.froms?.map(rewriteFromItem);

	const rewrittenJoins = node.joins?.map((joinNode: any) => {
		const rewritten = rewriteFromItem(joinNode.table);
		if (rewritten !== joinNode.table) {
			changed = true;
			return {
				...joinNode,
				table: rewritten,
			};
		}
		return joinNode;
	});

	if (!changed) {
		return node;
	}

	return {
		...node,
		from:
			rewrittenFroms && node.from
				? {
					kind: "FromNode",
					froms: rewrittenFroms,
				}
				: node.from,
		joins: rewrittenJoins ?? node.joins,
	};
}

function analyzeFromItem(
	node: OperationNode
): { alias: string } | undefined {
	if (node.kind === "AliasNode") {
		const baseTable = (node as any).node as OperationNode | undefined;
		const aliasNode = (node as any).alias as OperationNode | undefined;
		const tableName = extractTableName(baseTable);
		if (tableName !== STATE_ALL_VIEW) {
			return undefined;
		}
		return { alias: extractIdentifier(aliasNode) ?? STATE_ALL_VIEW };
	}

	if (node.kind === "TableNode") {
		const tableName = extractTableName(node);
		if (tableName !== STATE_ALL_VIEW) {
			return undefined;
		}
		return { alias: STATE_ALL_VIEW };
	}

	return undefined;
}

function extractIdentifier(
	node: OperationNode | undefined
): string | undefined {
	if (!node) return undefined;

	switch (node.kind) {
		case "IdentifierNode":
			return (node as any).name;
		case "SchemableIdentifierNode":
			return (node as any).identifier?.name;
		default:
			return undefined;
	}
}
