import {
	sql,
	type KyselyPlugin,
	type OperationNode,
	type PluginTransformQueryArgs,
	type RootOperationNode,
	type SelectQueryNode,
} from "kysely";
import {
	extractColumnName,
	extractTableName,
	extractValues,
} from "./operation-node-utils.js";
import { schemaKeyToCacheTableName } from "../../state/cache/create-schema-cache-table.js";

type StateViewName = "state" | "state_all" | "state_with_tombstones";

const STATE_VIEW_NAMES = new Set<StateViewName>([
	"state",
	"state_all",
	"state_with_tombstones",
]);

/**
 * Creates a query processor plugin that rewrites reads against the public
 * `state` view to hit the schema-specific cache tables directly, letting
 * SQLite's optimizer plan on the physical layout instead of the vtable.
 *
 * @example
 * const db = new Kysely({
 *   dialect: createEngineDialect({ database }),
 *   plugins: [createCachePopulator({ engine }), createStateRouter()],
 * });
 */

export function createQueryRouter(): KyselyPlugin {
	return {
		transformQuery(transformArgs: PluginTransformQueryArgs): RootOperationNode {
			const { node: rewritten, changed } = rewriteStateQueryNode(
				transformArgs.node
			);
			return changed ? (rewritten as RootOperationNode) : transformArgs.node;
		},
		transformResult: async (resultArgs) => resultArgs.result,
	};
}

export function rewriteStateQueryNode(node: RootOperationNode): {
	node: RootOperationNode;
	changed: boolean;
} {
	if (node.kind !== "SelectQueryNode") {
		return { node, changed: false };
	}

	const rewritten = rewriteSelectQuery(node as SelectQueryNode);
	return { node: rewritten.node, changed: rewritten.changed };
}

function rewriteSelectQuery(node: SelectQueryNode): {
	node: SelectQueryNode;
	changed: boolean;
} {
	const from = node.from;
	const where = node.where?.where;

	let changed = false;

	const rewrittenFroms =
		from?.froms?.map((fromItem) => {
			const rewritten = rewriteFromItem({ fromItem, where });
			if (rewritten !== fromItem) {
				changed = true;
			}
			return rewritten;
		}) ?? from?.froms;

	const rewrittenJoins = node.joins?.map((joinNode: any) => {
		const rewrittenTable = rewriteFromItem({ fromItem: joinNode.table, where });
		if (rewrittenTable !== joinNode.table) {
			changed = true;
			return {
				...joinNode,
				table: rewrittenTable,
			};
		}
		return joinNode;
	});

	if (!changed) {
		return { node, changed: false };
	}

	return {
		node: {
			...node,
			from:
				from && rewrittenFroms
					? {
							kind: "FromNode",
							froms: rewrittenFroms,
						}
					: from,
			joins: rewrittenJoins ?? node.joins,
		},
		changed: true,
	};
}

function rewriteFromItem(args: {
	fromItem: OperationNode;
	where?: OperationNode;
}): OperationNode {
	const { fromItem, where } = args;
	const analysis = analyzeFromItem(fromItem);

	if (!analysis) {
		return fromItem;
	}

	const { viewName, alias } = analysis;

	const schemaKeys = collectSchemaFilters(where, alias ?? viewName);

	if (schemaKeys.length !== 1) {
		return fromItem;
	}

	const schemaKey = schemaKeys[0]!;
	const aliasName = alias ?? viewName;
	return buildStateSubquery({ schemaKey, alias: aliasName, viewName });
}

function analyzeFromItem(
	node: OperationNode
): { viewName: StateViewName; alias?: string } | undefined {
	if (node.kind === "AliasNode") {
		const baseTable = (node as any).node as OperationNode | undefined;
		const aliasNode = (node as any).alias as OperationNode | undefined;
		const viewName = extractTableName(baseTable) as StateViewName | undefined;
		const alias = extractIdentifier(aliasNode);

		if (!viewName || !STATE_VIEW_NAMES.has(viewName)) {
			return undefined;
		}

		return { viewName, alias: alias ?? viewName };
	}

	if (node.kind === "TableNode") {
		const viewName = extractTableName(node) as StateViewName | undefined;
		if (!viewName || !STATE_VIEW_NAMES.has(viewName)) {
			return undefined;
		}
		return { viewName, alias: viewName };
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

function collectSchemaFilters(
	node: OperationNode | undefined,
	alias: string
): string[] {
	const values = new Set<string>();
	collectSchemaFiltersRecursive(node, new Set([alias]), values);
	return Array.from(values);
}

function collectSchemaFiltersRecursive(
	node: OperationNode | undefined,
	aliases: Set<string>,
	output: Set<string>
): void {
	if (!node) return;

	switch (node.kind) {
		case "BinaryOperationNode": {
			const leftOperand = (node as any).leftOperand as
				| OperationNode
				| undefined;
			if (!leftOperand || leftOperand.kind !== "ReferenceNode") {
				return;
			}

			const tableName = extractTableName((leftOperand as any).table);
			if (tableName && !aliases.has(tableName)) {
				return;
			}

			const columnName = extractColumnName((leftOperand as any).column);
			if (columnName !== "schema_key") {
				return;
			}

			for (const value of extractValues((node as any).rightOperand)) {
				if (typeof value === "string" && value.length > 0) {
					output.add(value);
				}
			}
			return;
		}
		case "AndNode":
		case "OrNode": {
			collectSchemaFiltersRecursive((node as any).left, aliases, output);
			collectSchemaFiltersRecursive((node as any).right, aliases, output);
			return;
		}
		case "ParensNode": {
			collectSchemaFiltersRecursive((node as any).node, aliases, output);
			return;
		}
		default:
			return;
	}
}

function buildStateSubquery(args: {
	schemaKey: string;
	alias: string;
	viewName: StateViewName;
}): OperationNode {
	const { schemaKey, alias, viewName } = args;
	const conditions = [sql`schema_key = ${schemaKey}`];
	if (viewName === "state") {
		conditions.push(sql`version_id IN (SELECT version_id FROM active_version)`);
	}
	const whereClause = sql.join(conditions, sql` AND `);

	const baseColumns = [
		sql`entity_id`,
		sql`schema_key`,
		sql`file_id`,
		sql`plugin_key`,
		sql`snapshot_content`,
		sql`schema_version`,
		sql`created_at`,
		sql`updated_at`,
		sql`inherited_from_version_id`,
		sql`change_id`,
		sql`untracked`,
		sql`commit_id`,
		sql`writer_key`,
		sql`metadata`,
	];
	const columns =
		viewName === "state"
			? baseColumns
			: [sql`version_id`, ...baseColumns];
	const selectList = sql.join(columns, sql`, `);

	const subquery = sql`
		(SELECT ${selectList}
		 FROM internal_resolved_state_all
		 WHERE ${whereClause}
		) AS ${sql.id(alias)}
	`;

	return subquery.toOperationNode();
}

function buildWhereClauses(viewName: StateViewName, schemaKey: string) {
	const clauses = [sql`c.schema_key = ${schemaKey}`];

	if (viewName !== "state_with_tombstones") {
		clauses.push(sql`c.inheritance_delete_marker = 0`);
		clauses.push(sql`c.snapshot_content IS NOT NULL`);
	}

	if (viewName === "state") {
		clauses.push(sql`c.version_id IN (SELECT version_id FROM active_version)`);
	}

	return clauses;
}

function buildSelectColumns(viewName: StateViewName) {
	const baseColumns = [sql`c.entity_id`, sql`c.schema_key`, sql`c.file_id`];

	if (viewName !== "state") {
		baseColumns.push(sql`c.version_id`);
	}

	baseColumns.push(sql`c.plugin_key`);

	const snapshotColumn =
		viewName === "state_with_tombstones"
			? sql`CASE WHEN c.snapshot_content IS NULL THEN NULL ELSE json(c.snapshot_content) END AS snapshot_content`
			: sql`json(c.snapshot_content) AS snapshot_content`;

	const tailColumns = [
		snapshotColumn,
		sql`c.schema_version`,
		sql`c.created_at`,
		sql`c.updated_at`,
		sql`c.inherited_from_version_id`,
		sql`c.change_id`,
		sql`0 AS untracked`,
		sql`c.commit_id`,
		sql`ws.writer_key`,
		sql`json(ch.metadata) AS metadata`,
	];

	return [...baseColumns, ...tailColumns];
}
