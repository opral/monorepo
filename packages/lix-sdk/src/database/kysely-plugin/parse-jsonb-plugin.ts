import {
	AliasNode,
	TableNode,
	type KyselyPlugin,
	type PluginTransformQueryArgs,
} from "kysely";

type QueryId = PluginTransformQueryArgs["queryId"];

export function ParseJsonBPlugin(
	jsonbColumns: Record<string, string[]>,
): KyselyPlugin {
	const data = new WeakMap<QueryId, { jsonbColumNames: string[] }>();

	return {
		transformResult: async (args) => {
			const jsonbColumNames = data.get(args.queryId)?.jsonbColumNames;
			// no json columns in query -> return result as is
			if (jsonbColumNames === undefined) {
				return args.result;
			}

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

			const jsonbSelections = [];

			for (const node of query.from?.froms ?? []) {
				let tableName: string;
				let tableAlias: string | undefined;

				// direct query with no alias
				// select * from foo
				if (node.kind === "TableNode") {
					tableName = (node as TableNode).table.identifier.name;
				}
				// query is aliased
				// select * from foo as f
				else if (node.kind === "AliasNode") {
					tableName = (node as AliasNode).node.table?.identifier.name;
					tableAlias = (node as AliasNode).alias?.name as string;
				} else {
					continue;
				}
				const jsonbCols = jsonbColumns[tableName] ?? [];
				for (const col of jsonbCols) {
					jsonbSelections.push({
						kind: "SelectionNode",
						selection: {
							kind: "AliasNode",
							node: {
								kind: "FunctionNode",
								func: "json",
								arguments: [
									{
										kind: "ReferenceNode",
										table: tableAlias
											? {
													kind: "TableNode",
													table: {
														kind: "SchemableIdentifierNode",
														identifier: {
															kind: "IdentifierNode",
															name: tableAlias, // Use the alias if present
														},
													},
												}
											: {
													kind: "TableNode",
													table: {
														kind: "SchemableIdentifierNode",
														identifier: {
															kind: "IdentifierNode",
															name: tableName, // Otherwise, use the table name
														},
													},
												},
										column: {
											kind: "ColumnNode",
											column: { kind: "IdentifierNode", name: col },
										},
									},
								],
							},
							alias: { kind: "IdentifierNode", name: col },
						},
					});
				}
			}

			if (jsonbSelections.length > 0) {
				data.set(args.queryId, {
					jsonbColumNames: jsonbSelections.map((s) => s.selection.alias.name),
				});
			}

			return {
				...query,

				selections: [...(query.selections ?? []), ...jsonbSelections],
			};
		},
	};
}
