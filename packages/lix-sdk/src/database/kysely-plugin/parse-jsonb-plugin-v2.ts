// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck

/**
 * THIS WAS A PROTOYPE FOR DETECTING JSONB COLUMNS
 * INSTEAD OF RELYING ON HEURISTICS BUT WAS TOO COMPLEX
 * FOR v1 of lix.
 *
 * Code still exists for future reference.
 *
 * https://github.com/opral/lix-sdk/issues/145
 */

import {
	AliasNode,
	FromNode,
	SelectionNode,
	type KyselyPlugin,
	type PluginTransformQueryArgs,
} from "kysely";

type QueryId = PluginTransformQueryArgs["queryId"];

export function ParseJsonBPluginV2(
	jsonbColumns: Record<string, string[]>
): KyselyPlugin {
	const data = new WeakMap<QueryId, { jsonbColumNames: string[] }>();

	return {
		transformResult: async (args) => {
			const jsonbColumNames = data.get(args.queryId)?.jsonbColumNames;
			if (!jsonbColumNames) return args.result;

			for (const row of args.result.rows) {
				for (const col of jsonbColumNames) {
					row[col] = JSON.parse(row[col] as string);
				}
			}

			return args.result;
		},
		transformQuery: (args) => {
			const query = args.node;

			if (query.kind !== "SelectQueryNode") {
				return query;
			}

			// Transform the selections (handles both select and selectAll)
			const { transformedSelections, jsonbColumNames } = transformSelections(
				query.selections,
				query.from?.froms ?? [],
				jsonbColumns
			);

			// Store the transformed column aliases for result parsing
			data.set(args.queryId, { jsonbColumNames });

			// Return the updated query node
			return {
				...query,
				selections: transformedSelections,
			};
		},
	};
}

/**
 * Transforms selections to include JSONB column parsing, respecting aliases.
 */
function transformSelections(
	selections: readonly SelectionNode[] | undefined,
	fromNodes: readonly FromNode[] | undefined,
	jsonbColumns: Record<string, string[]>
): { transformedSelections: readonly any[]; jsonbColumNames: string[] } {
	if (!fromNodes)
		return { transformedSelections: selections ?? [], jsonbColumNames: [] };

	const jsonbSelections = [];
	const jsonbColumNames: string[] = [];

	// Extract the fallback table name if there's only one table in fromNodes
	let fallbackTableName: string | undefined;
	let fallbackTableAlias: string | undefined;

	if (fromNodes.length === 1) {
		const node = fromNodes[0];
		if (node.kind === "TableNode") {
			fallbackTableName = node.table?.identifier.name;
		} else if (node.kind === "AliasNode") {
			fallbackTableName = (node as AliasNode).node.table?.identifier.name;
			fallbackTableAlias = (node as AliasNode).alias?.name as string;
		}
	}

	// Iterate over the selection nodes
	for (const selection of selections ?? []) {
		let tableName: string | undefined;
		let columnName: string | undefined;
		let aliasName: string | undefined;

		if (selection.selection?.kind === "ReferenceNode") {
			const potentialTableName =
				selection.selection.table?.table?.identifier?.name || fallbackTableName;

			const alias = fromNodes.find(
				(n) => n.kind === "AliasNode" && n.alias.name === potentialTableName
			);

			if (alias) {
				tableName = (alias as AliasNode).node.table?.identifier.name;
				aliasName = (alias as AliasNode).alias.name;
			} else {
				tableName = potentialTableName;
			}

			columnName = selection.selection.column?.column?.name;

			const isAlias = fromNodes.some(
				(n) => n.kind === "AliasNode" && n.alias.name === tableName
			);

			// If the table name is an alias, find the real name
			if (isAlias) {
				const aliasNode = fromNodes.find(
					(n) => n.kind === "AliasNode" && n.alias.name === tableName
				) as AliasNode;
				tableName = aliasNode.node.table?.identifier.name;
			}
		} else if (selection.selection?.kind === "AliasNode") {
			// AliasNode: Extract alias and reference details
			aliasName = selection.selection.alias?.name;
			if (selection.selection.node?.kind === "ReferenceNode") {
				tableName =
					selection.selection.node?.table?.table?.identifier?.name ||
					fallbackTableName;
				columnName = selection.selection.node?.column?.column?.name;
			}
		} else if (selection.selection.kind === "SelectAllNode") {
			tableName =
				selection.selection.table?.table?.identifier?.name || fallbackTableName;
			aliasName = selection.selection.alias?.name || fallbackTableAlias;
		}

		if (!tableName) continue;

		const jsonbCols = jsonbColumns[tableName] ?? [];

		for (const col of jsonbCols) {
			const effectiveAlias = aliasName ?? columnName ?? col;

			// Track the column key for result transformation
			jsonbColumNames.push(effectiveAlias);

			// Add the JSON transformation
			jsonbSelections.push({
				kind: "SelectionNode",
				selection: {
					kind: "AliasNode",
					node: {
						kind: "FunctionNode",
						func: "jsonb",
						arguments: [
							{
								kind: "ReferenceNode",
								table: {
									kind: "TableNode",
									table: {
										kind: "SchemableIdentifierNode",
										identifier: {
											kind: "IdentifierNode",
											name: tableName,
										},
									},
								},
								column: {
									kind: "ColumnNode",
									column: { kind: "IdentifierNode", name: effectiveAlias },
								},
							},
						],
					},
					alias: { kind: "IdentifierNode", name: effectiveAlias },
				},
			});
		}
	}

	// Merge existing selections with new JSONB transformations
	return {
		transformedSelections: [...(selections ?? []), ...jsonbSelections],
		jsonbColumNames,
	};
}
