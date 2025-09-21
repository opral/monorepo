import type {
	KyselyPlugin,
	OperationNode,
	PluginTransformQueryArgs,
	RootOperationNode,
	SelectQueryNode,
} from "kysely";
import type { LixEngine } from "../boot.js";
import { isStaleStateCache } from "../../state/cache/is-stale-state-cache.js";
import { populateStateCache } from "../../state/cache/populate-state-cache.js";
import { markStateCacheAsFresh } from "../../state/cache/mark-state-cache-as-stale.js";

const STATE_TABLE_NAMES = new Set([
	"state",
	"state_all",
	"state_with_tombstones",
]);
/**
 * Returns a Kysely plugin that mirrors the legacy vtable behaviour for state
 * reads: before the query hits SQLite we ensure the cache is populated and mark
 * it as fresh so subsequent reads avoid redundant work.
 */
export function cachePopulator(args: {
	engine: Pick<LixEngine, "sqlite" | "hooks">;
}): KyselyPlugin {
	return {
		transformQuery(transformArgs: PluginTransformQueryArgs): RootOperationNode {
			if (transformArgs.node.kind !== "SelectQueryNode") {
				return transformArgs.node;
			}

			const selectNode = transformArgs.node as SelectQueryNode;
			const stateTables = extractStateTables(selectNode);

			if (stateTables.length === 0) {
				return transformArgs.node;
			}

			const engine = args.engine;

			if (!isStaleStateCache({ engine })) {
				return transformArgs.node;
			}

			const versionIds = collectVersionFilters(selectNode.where?.where);

			if (versionIds.length === 0) {
				populateStateCache({ engine });
			} else {
				for (const versionId of versionIds) {
					populateStateCache({
						engine,
						options: { version_id: versionId },
					});
				}
			}
			markStateCacheAsFresh({ engine });

			return transformArgs.node;
		},
		transformResult: async (resultArgs) => resultArgs.result,
	};
}

function extractStateTables(selectNode: SelectQueryNode): string[] {
	const from = selectNode.from;
	if (!from) return [];

	const tables: string[] = [];

	for (const fromItem of from.froms ?? []) {
		const tableName = extractTableName(fromItem);
		if (tableName && STATE_TABLE_NAMES.has(tableName)) {
			tables.push(tableName);
		}
	}

	return tables;
}

function extractTableName(node: OperationNode | undefined): string | undefined {
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

function collectVersionFilters(node: OperationNode | undefined): string[] {
	const values = new Set<string>();
	collectVersionFiltersRecursive(node, values);
	return Array.from(values);
}

function collectVersionFiltersRecursive(
	node: OperationNode | undefined,
	output: Set<string>
): void {
	if (!node) return;

	switch (node.kind) {
		case "BinaryOperationNode": {
			const columnName = extractColumnName((node as any).leftOperand);
			if (columnName !== "version_id") return;
			for (const value of extractValues((node as any).rightOperand)) {
				if (typeof value === "string" && value.length > 0) {
					output.add(value);
				}
			}
			return;
		}
		case "AndNode":
		case "OrNode": {
			collectVersionFiltersRecursive((node as any).left, output);
			collectVersionFiltersRecursive((node as any).right, output);
			return;
		}
		case "ParensNode": {
			collectVersionFiltersRecursive((node as any).node, output);
			return;
		}
		default:
			return;
	}
}

function extractColumnName(
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

function extractValues(node: OperationNode | undefined): unknown[] {
	if (!node) return [];

	switch (node.kind) {
		case "ValueNode":
			return [(node as any).value];
		case "PrimitiveValueListNode":
			return [...((node as any).values ?? [])];
		case "ValueListNode":
			return ((node as any).values ?? []).flatMap((valueNode: OperationNode) =>
				extractValues(valueNode)
			);
		case "RawNode": {
			const parameters = (node as any).parameters ?? [];
			return parameters.flatMap((param: OperationNode) => extractValues(param));
		}
		default:
			return [];
	}
}
