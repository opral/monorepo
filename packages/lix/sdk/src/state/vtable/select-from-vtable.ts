import {
	sql,
	type KyselyPlugin,
	type PluginTransformQueryArgs,
	type PluginTransformResultArgs,
	type QueryResult,
	type RootOperationNode,
	type SelectQueryBuilder,
	type UnknownRow,
} from "kysely";
import type { LixInternalDatabaseSchema } from "../../database/schema.js";
import { internalQueryBuilder } from "../../engine/internal-query-builder.js";
import { schemaKeyToCacheTableName } from "../cache/create-schema-cache-table.js";
import { selectFromStateCache } from "../cache/select-from-state-cache.js";

const TARGET_TABLE = "lix_internal_state_vtable";
const CACHE_SOURCE_TOKEN = "__CACHE_SOURCE__";

const VTABLE_COLUMNS = [
	"_pk",
	"entity_id",
	"schema_key",
	"file_id",
	"version_id",
	"plugin_key",
	"snapshot_content",
	"schema_version",
	"created_at",
	"updated_at",
	"inherited_from_version_id",
	"change_id",
	"untracked",
	"commit_id",
	"metadata",
	"writer_key",
] as const;

const VTABLE_COLUMN_SET = new Set<string>(VTABLE_COLUMNS);

type VtableColumn = (typeof VTABLE_COLUMNS)[number];

type SelectFromVtablePluginOptions = {
	existingCacheTables?: ReadonlySet<string>;
};

type InlineVtableSqlOptions = {
	schemaKeys: readonly string[];
	requiredColumns?: readonly string[] | null;
};

export type SelectFromVtableContext = {
	existingCacheTables?: ReadonlySet<string>;
};

/**
 * Returns a query builder that targets the internal state vtable.
 *
 * The builder is pre-wired with a rewrite plugin so future optimisations
 * can transparently shape the query through the Kysely AST.
 *
 * @example
 * ```ts
 * const compiled = selectFromVtable({ existingCacheTables })
 *   .where("schema_key", "=", "lix_key_value")
 *   .select(["entity_id", "snapshot_content"])
 *   .compile();
 * ```
 */
export const selectFromVtable: (
	context?: SelectFromVtableContext
) => SelectQueryBuilder<LixInternalDatabaseSchema, typeof TARGET_TABLE, {}> = (
	context
) => {
	const pluginOptions: SelectFromVtablePluginOptions =
		context?.existingCacheTables
			? { existingCacheTables: context.existingCacheTables }
			: {};

	return internalQueryBuilder
		.withPlugin(new InlineSelectFromVtablePlugin(pluginOptions))
		.selectFrom(TARGET_TABLE);
};

class InlineSelectFromVtablePlugin implements KyselyPlugin {
	constructor(private readonly options: SelectFromVtablePluginOptions = {}) {}

	transformQuery(args: PluginTransformQueryArgs): RootOperationNode {
		return rewriteRootNode(args.node, this.options);
	}

	async transformResult(
		args: PluginTransformResultArgs
	): Promise<QueryResult<UnknownRow>> {
		return args.result;
	}
}

function rewriteRootNode(
	node: RootOperationNode,
	options: SelectFromVtablePluginOptions
): RootOperationNode {
	if (node.kind === "SelectQueryNode") {
		return rewriteSelectQuery(node, options);
	}
	return node;
}

function rewriteSelectQuery(
	node: any,
	options: SelectFromVtablePluginOptions
): any {
	if (!node.from || node.from.froms.length === 0) {
		return node;
	}

	const cacheTables = options.existingCacheTables;
	if (!cacheTables || cacheTables.size === 0) {
		return node;
	}

	const rewrites: Array<{ index: number; alias: string }> = [];

	node.from.froms.forEach((fromNode: any, index: number) => {
		const alias = extractVtableAlias(fromNode);
		if (alias) {
			rewrites.push({ index, alias });
		}
	});

	if (rewrites.length === 0) {
		return node;
	}

	const rewriteAliases = rewrites.map((entry) => entry.alias);

	const schemaKeys = collectSchemaKeyFilters(
		node.where?.where ?? null,
		rewriteAliases
	);

	const filteredSchemaKeys = schemaKeys.filter((key) =>
		hasCacheTableForSchema(key, cacheTables)
	);

	if (filteredSchemaKeys.length === 0) {
		return node;
	}

	if (!hasCacheTableForSchema("lix_version_descriptor", cacheTables)) {
		return node;
	}

	const requiredColumns = collectRequiredColumns(node, rewriteAliases);

	const inlineSql = buildInlineVtableSql({
		schemaKeys: filteredSchemaKeys,
		requiredColumns,
	});
	const newFroms = [...node.from.froms];

	for (const { index, alias } of rewrites) {
		const derived = sql`(${sql.raw(inlineSql)})`.as(alias);
		newFroms[index] = derived.toOperationNode();
	}

	return {
		...node,
		from: {
			...node.from,
			froms: newFroms,
		},
	};
}

function extractVtableAlias(node: any): string | null {
	if (node.kind === "TableNode") {
		const tableName = node.table?.identifier?.name;
		return tableName === TARGET_TABLE ? TARGET_TABLE : null;
	}

	if (node.kind === "AliasNode") {
		const inner = node.node;
		const tableName = inner?.table?.identifier?.name;
		if (tableName === TARGET_TABLE) {
			const alias = node.alias;
			if (alias?.name) {
				return alias.name;
			}
			return TARGET_TABLE;
		}
	}

	return null;
}

function collectSchemaKeyFilters(
	where: any,
	aliases: readonly string[]
): string[] {
	if (!where) {
		return [];
	}

	const result = new Set<string>();
	const aliasSet = new Set(aliases);

	const visit = (expr: any): void => {
		if (!expr) return;
		switch (expr.kind) {
			case "BinaryOperationNode":
				handleBinary(expr);
				break;
			case "AndNode":
			case "OrNode":
				visit(expr.left);
				visit(expr.right);
				break;
			case "ParensNode":
				visit(expr.node);
				break;
			default:
				break;
		}
	};

	const handleBinary = (binaryNode: any): void => {
		if (binaryNode.leftOperand?.kind !== "ReferenceNode") {
			return;
		}
		if (!isSchemaKeyReference(binaryNode.leftOperand, aliasSet)) {
			return;
		}

		if (binaryNode.operator?.operator === "=") {
			if (binaryNode.rightOperand?.kind === "ValueNode") {
				const value = binaryNode.rightOperand.value;
				if (typeof value === "string" && value.length > 0) {
					result.add(value);
				}
			}
			return;
		}

		if (binaryNode.operator?.operator === "in") {
			const list = binaryNode.rightOperand;
			if (!list) return;
			if (
				list.kind === "PrimitiveValueListNode" &&
				Array.isArray(list.values)
			) {
				for (const value of list.values) {
					if (typeof value === "string" && value.length > 0) {
						result.add(value);
					}
				}
				return;
			}
			if (list.kind === "ValueListNode" && Array.isArray(list.values)) {
				for (const item of list.values) {
					if (item?.kind === "ValueNode") {
						const value = item.value;
						if (typeof value === "string" && value.length > 0) {
							result.add(value);
						}
					}
				}
			}
		}
	};

	visit(where);

	return [...result];
}

type ColumnCollectionResult = {
	columns: Set<string>;
	requiresAll: boolean;
};

function collectRequiredColumns(
	node: any,
	aliases: readonly string[]
): readonly string[] | null {
	if (!node) {
		return null;
	}

	const aliasSet = new Set<string>(aliases);
	aliasSet.add(TARGET_TABLE);

	const selectionResult = collectSelectionColumns(node.selections, aliasSet);
	if (selectionResult.requiresAll) {
		return null;
	}

	const collected = new Set<string>(selectionResult.columns);

	const whereResult = collectColumnsFromWhere(
		node.where?.where ?? null,
		aliasSet
	);
	if (whereResult.requiresAll) {
		return null;
	}
	whereResult.columns.forEach((column) => collected.add(column));

	const orderByResult = collectColumnsFromOrderBy(node.orderBy, aliasSet);
	if (orderByResult.requiresAll) {
		return null;
	}
	orderByResult.columns.forEach((column) => collected.add(column));

	const groupByResult = collectColumnsFromGroupBy(node.groupBy, aliasSet);
	if (groupByResult.requiresAll) {
		return null;
	}
	groupByResult.columns.forEach((column) => collected.add(column));

	if (collected.size === 0) {
		return null;
	}

	return [...collected];
}

function collectSelectionColumns(
	selections: readonly any[] | undefined,
	aliases: ReadonlySet<string>
): ColumnCollectionResult {
	if (!selections || selections.length === 0) {
		return { columns: new Set(), requiresAll: true };
	}

	const columns = new Set<string>();

	for (const selection of selections) {
		const selectionNode = selection?.selection;
		if (!selectionNode) {
			return { columns: new Set(), requiresAll: true };
		}
		const { column, requiresAll } = extractColumnReference(
			selectionNode,
			aliases
		);
		if (requiresAll) {
			return { columns: new Set(), requiresAll: true };
		}
		if (column) {
			columns.add(column);
			continue;
		}
		return { columns: new Set(), requiresAll: true };
	}

	return { columns, requiresAll: false };
}

function collectColumnsFromWhere(
	where: any,
	aliases: ReadonlySet<string>
): ColumnCollectionResult {
	const columns = new Set<string>();
	if (!where) {
		return { columns, requiresAll: false };
	}

	let requiresAll = false;

	const visit = (value: any): void => {
		if (requiresAll || value === null || value === undefined) {
			return;
		}
		if (Array.isArray(value)) {
			for (const item of value) {
				visit(item);
				if (requiresAll) {
					return;
				}
			}
			return;
		}
		if (typeof value !== "object") {
			return;
		}

		const { column, requiresAll: columnRequiresAll } = extractColumnReference(
			value,
			aliases
		);
		if (columnRequiresAll) {
			requiresAll = true;
			return;
		}
		if (column) {
			columns.add(column);
		}

		for (const nested of Object.values(value)) {
			visit(nested);
			if (requiresAll) {
				return;
			}
		}
	};

	visit(where);

	return { columns, requiresAll };
}

function collectColumnsFromOrderBy(
	orderBy: any,
	aliases: ReadonlySet<string>
): ColumnCollectionResult {
	const columns = new Set<string>();
	if (!orderBy || !Array.isArray(orderBy.items)) {
		return { columns, requiresAll: false };
	}

	let requiresAll = false;

	for (const item of orderBy.items) {
		const target = item?.orderBy;
		if (!target) {
			continue;
		}
		const { column, requiresAll: columnRequiresAll } = extractColumnReference(
			target,
			aliases
		);
		if (columnRequiresAll) {
			requiresAll = true;
			break;
		}
		if (column) {
			columns.add(column);
		}
	}

	return { columns, requiresAll };
}

function collectColumnsFromGroupBy(
	groupBy: any,
	aliases: ReadonlySet<string>
): ColumnCollectionResult {
	const columns = new Set<string>();
	if (!groupBy || !Array.isArray(groupBy.items)) {
		return { columns, requiresAll: false };
	}

	let requiresAll = false;

	for (const item of groupBy.items) {
		const target = item?.groupBy;
		if (!target) {
			continue;
		}
		const { column, requiresAll: columnRequiresAll } = extractColumnReference(
			target,
			aliases
		);
		if (columnRequiresAll) {
			requiresAll = true;
			break;
		}
		if (column) {
			columns.add(column);
		}
	}

	return { columns, requiresAll };
}

function extractColumnReference(
	node: any,
	aliases: ReadonlySet<string>
): { column: string | null; requiresAll: boolean } {
	if (!node) {
		return { column: null, requiresAll: false };
	}

	if (node.kind === "AliasNode") {
		return extractColumnReference(node.node, aliases);
	}

	if (node.kind === "ReferenceNode") {
		const tableName = extractTableIdentifierName(node.table);
		if (tableName && aliases.size > 0 && !aliases.has(tableName)) {
			return { column: null, requiresAll: false };
		}
		const columnNode = node.column;
		if (!columnNode) {
			return { column: null, requiresAll: false };
		}
		if (columnNode.kind === "SelectAllNode") {
			return { column: null, requiresAll: true };
		}
		if (columnNode.kind === "ColumnNode") {
			const identifier = columnNode.column;
			const name = identifier?.name;
			return typeof name === "string"
				? { column: name, requiresAll: false }
				: { column: null, requiresAll: false };
		}
		return { column: null, requiresAll: false };
	}

	if (node.kind === "ColumnNode") {
		const identifier = node.column;
		const name = identifier?.name;
		return typeof name === "string"
			? { column: name, requiresAll: false }
			: { column: null, requiresAll: false };
	}

	return { column: null, requiresAll: false };
}

function extractTableIdentifierName(tableNode: any): string | null {
	const identifier = tableNode?.table?.identifier?.name;
	return typeof identifier === "string" ? identifier : null;
}

function isSchemaKeyReference(
	reference: any,
	aliases: ReadonlySet<string>
): boolean {
	if (!reference.column || reference.column.kind !== "ColumnNode") {
		return false;
	}

	const column = reference.column.column;
	if (!column || column.kind !== "IdentifierNode") {
		return false;
	}
	if (column.name !== "schema_key") {
		return false;
	}

	const tableIdentifier = reference.table?.table?.identifier;
	if (!tableIdentifier || tableIdentifier.kind !== "IdentifierNode") {
		return true;
	}

	return aliases.has(tableIdentifier.name);
}

function hasCacheTableForSchema(
	schemaKey: string,
	cacheTables: ReadonlySet<string>
): boolean {
	const tableName = schemaKeyToCacheTableName(schemaKey);
	return cacheTables.has(tableName);
}

function buildInlineVtableSql(options: InlineVtableSqlOptions): string {
	const schemaKeys = normalizeSchemaKeys(options.schemaKeys);
	const columns = normalizeColumns(options.requiredColumns);
	const cacheRoutingSql = buildCacheRoutingSql(schemaKeys);
	const baseSql = buildBaseResolvedStateSql(columns);
	return baseSql.replaceAll(CACHE_SOURCE_TOKEN, `(${cacheRoutingSql})`);
}

function normalizeSchemaKeys(schemaKeys: readonly string[]): string[] {
	const result: string[] = [];
	const seen = new Set<string>();
	for (const schemaKey of schemaKeys) {
		if (!schemaKey || seen.has(schemaKey)) {
			continue;
		}
		seen.add(schemaKey);
		result.push(schemaKey);
	}
	if (!seen.has("lix_version_descriptor")) {
		result.push("lix_version_descriptor");
	}
	return result;
}

function normalizeColumns(
	requiredColumns?: readonly string[] | null
): readonly VtableColumn[] {
	if (!requiredColumns || requiredColumns.length === 0) {
		return VTABLE_COLUMNS;
	}

	const selected = new Set<VtableColumn>();
	for (const column of requiredColumns) {
		if (VTABLE_COLUMN_SET.has(column)) {
			selected.add(column as VtableColumn);
		}
	}

	if (selected.size === 0) {
		return VTABLE_COLUMNS;
	}

	return VTABLE_COLUMNS.filter((column) => selected.has(column));
}

function buildBaseResolvedStateSql(columns: readonly VtableColumn[]): string {
	return [buildVersionCtes(), buildResolvedSelectBody(columns)].join("\n");
}

function buildCacheRoutingSql(schemaKeys: readonly string[]): string {
	const statements = schemaKeys.map(compileCacheSelectStatement);
	if (statements.length === 1) {
		return statements[0]!;
	}

	return statements.join("\nUNION ALL\n");
}

function compileCacheSelectStatement(schemaKey: string): string {
	const compiled = selectFromStateCache(schemaKey).selectAll().compile();
	if (compiled.parameters.length > 0) {
		throw new Error(
			"selectFromStateCache generated parameterised SQL which is not supported"
		);
	}
	const match = compiled.sql.match(
		/^select\s+\*\s+from\s*\((?<inner>select[\s\S]+)\)\s+as\s+"internal_state_cache_routed"$/i
	);
	return match?.groups?.inner?.trim() ?? compiled.sql;
}

function buildVersionCtes(): string {
	return stripIndent(`
		WITH RECURSIVE
			version_descriptor_base AS (
				SELECT
					json_extract(isc_v.snapshot_content, '$.id') AS version_id,
					json_extract(isc_v.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id
				FROM ${CACHE_SOURCE_TOKEN} isc_v
				WHERE isc_v.schema_key = 'lix_version_descriptor'
			),
			version_inheritance(version_id, ancestor_version_id) AS (
				SELECT
					vdb.version_id,
					vdb.inherits_from_version_id
				FROM version_descriptor_base vdb
				WHERE vdb.inherits_from_version_id IS NOT NULL

				UNION

				SELECT
					vir.version_id,
					vdb.inherits_from_version_id
				FROM version_inheritance vir
				JOIN version_descriptor_base vdb ON vdb.version_id = vir.ancestor_version_id
				WHERE vdb.inherits_from_version_id IS NOT NULL
			),
			version_parent AS (
				SELECT
					vdb.version_id,
					vdb.inherits_from_version_id AS parent_version_id
				FROM version_descriptor_base vdb
				WHERE vdb.inherits_from_version_id IS NOT NULL
			)
	`);
}

function buildResolvedSelectBody(columns: readonly VtableColumn[]): string {
	const segments = [
		buildTransactionSegment(columns),
		buildUntrackedSegment(columns),
		buildCachedSegment(columns),
		buildInheritedCacheSegment(columns),
		buildInheritedUntrackedSegment(columns),
		buildInheritedTransactionSegment(columns),
	];

	return [
		"      SELECT * FROM (",
		segments.join("\n\n\t\tUNION ALL\n\n"),
		"\t\t)",
	].join("\n");
}

const TRANSACTION_COLUMN_EXPRESSIONS: Record<VtableColumn, string> = {
	_pk: `'T' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(txn.version_id) AS _pk`,
	entity_id: "txn.entity_id AS entity_id",
	schema_key: "txn.schema_key AS schema_key",
	file_id: "txn.file_id AS file_id",
	version_id: "txn.version_id AS version_id",
	plugin_key: "txn.plugin_key AS plugin_key",
	snapshot_content: "json(txn.snapshot_content) AS snapshot_content",
	schema_version: "txn.schema_version AS schema_version",
	created_at: "txn.created_at AS created_at",
	updated_at: "txn.created_at AS updated_at",
	inherited_from_version_id: "NULL AS inherited_from_version_id",
	change_id: "txn.id AS change_id",
	untracked: "txn.untracked AS untracked",
	commit_id: "'pending' AS commit_id",
	metadata: "json(txn.metadata) AS metadata",
	writer_key: "ws_txn.writer_key AS writer_key",
};

const UNTRACKED_COLUMN_EXPRESSIONS: Record<VtableColumn, string> = {
	_pk: `'U' || '~' || lix_encode_pk_part(u.file_id) || '~' || lix_encode_pk_part(u.entity_id) || '~' || lix_encode_pk_part(u.version_id) AS _pk`,
	entity_id: "u.entity_id AS entity_id",
	schema_key: "u.schema_key AS schema_key",
	file_id: "u.file_id AS file_id",
	version_id: "u.version_id AS version_id",
	plugin_key: "u.plugin_key AS plugin_key",
	snapshot_content: "json(u.snapshot_content) AS snapshot_content",
	schema_version: "u.schema_version AS schema_version",
	created_at: "u.created_at AS created_at",
	updated_at: "u.updated_at AS updated_at",
	inherited_from_version_id: "NULL AS inherited_from_version_id",
	change_id: "'untracked' AS change_id",
	untracked: "1 AS untracked",
	commit_id: "'untracked' AS commit_id",
	metadata: "NULL AS metadata",
	writer_key: "ws_untracked.writer_key AS writer_key",
};

const CACHED_COLUMN_EXPRESSIONS: Record<VtableColumn, string> = {
	_pk: `'C' || '~' || lix_encode_pk_part(c.file_id) || '~' || lix_encode_pk_part(c.entity_id) || '~' || lix_encode_pk_part(c.version_id) AS _pk`,
	entity_id: "c.entity_id AS entity_id",
	schema_key: "c.schema_key AS schema_key",
	file_id: "c.file_id AS file_id",
	version_id: "c.version_id AS version_id",
	plugin_key: "c.plugin_key AS plugin_key",
	snapshot_content: "json(c.snapshot_content) AS snapshot_content",
	schema_version: "c.schema_version AS schema_version",
	created_at: "c.created_at AS created_at",
	updated_at: "c.updated_at AS updated_at",
	inherited_from_version_id:
		"c.inherited_from_version_id AS inherited_from_version_id",
	change_id: "c.change_id AS change_id",
	untracked: "0 AS untracked",
	commit_id: "c.commit_id AS commit_id",
	metadata: "ch.metadata AS metadata",
	writer_key: "ws_cache.writer_key AS writer_key",
};

const INHERITED_CACHE_COLUMN_EXPRESSIONS: Record<VtableColumn, string> = {
	_pk: `'CI' || '~' || lix_encode_pk_part(isc.file_id) || '~' || lix_encode_pk_part(isc.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk`,
	entity_id: "isc.entity_id AS entity_id",
	schema_key: "isc.schema_key AS schema_key",
	file_id: "isc.file_id AS file_id",
	version_id: "vi.version_id AS version_id",
	plugin_key: "isc.plugin_key AS plugin_key",
	snapshot_content: "json(isc.snapshot_content) AS snapshot_content",
	schema_version: "isc.schema_version AS schema_version",
	created_at: "isc.created_at AS created_at",
	updated_at: "isc.updated_at AS updated_at",
	inherited_from_version_id: "isc.version_id AS inherited_from_version_id",
	change_id: "isc.change_id AS change_id",
	untracked: "0 AS untracked",
	commit_id: "isc.commit_id AS commit_id",
	metadata: "ch.metadata AS metadata",
	writer_key:
		"COALESCE(ws_child.writer_key, ws_parent.writer_key) AS writer_key",
};

const INHERITED_UNTRACKED_COLUMN_EXPRESSIONS: Record<VtableColumn, string> = {
	_pk: `'UI' || '~' || lix_encode_pk_part(unt.file_id) || '~' || lix_encode_pk_part(unt.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk`,
	entity_id: "unt.entity_id AS entity_id",
	schema_key: "unt.schema_key AS schema_key",
	file_id: "unt.file_id AS file_id",
	version_id: "vi.version_id AS version_id",
	plugin_key: "unt.plugin_key AS plugin_key",
	snapshot_content: "json(unt.snapshot_content) AS snapshot_content",
	schema_version: "unt.schema_version AS schema_version",
	created_at: "unt.created_at AS created_at",
	updated_at: "unt.updated_at AS updated_at",
	inherited_from_version_id: "unt.version_id AS inherited_from_version_id",
	change_id: "'untracked' AS change_id",
	untracked: "1 AS untracked",
	commit_id: "'untracked' AS commit_id",
	metadata: "NULL AS metadata",
	writer_key:
		"COALESCE(ws_child.writer_key, ws_parent.writer_key) AS writer_key",
};

const INHERITED_TRANSACTION_COLUMN_EXPRESSIONS: Record<VtableColumn, string> = {
	_pk: `'TI' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk`,
	entity_id: "txn.entity_id AS entity_id",
	schema_key: "txn.schema_key AS schema_key",
	file_id: "txn.file_id AS file_id",
	version_id: "vi.version_id AS version_id",
	plugin_key: "txn.plugin_key AS plugin_key",
	snapshot_content: "json(txn.snapshot_content) AS snapshot_content",
	schema_version: "txn.schema_version AS schema_version",
	created_at: "txn.created_at AS created_at",
	updated_at: "txn.created_at AS updated_at",
	inherited_from_version_id:
		"vi.parent_version_id AS inherited_from_version_id",
	change_id: "txn.id AS change_id",
	untracked: "txn.untracked AS untracked",
	commit_id: "'pending' AS commit_id",
	metadata: "json(txn.metadata) AS metadata",
	writer_key:
		"COALESCE(ws_child.writer_key, ws_parent.writer_key) AS writer_key",
};

function buildTransactionSegment(columns: readonly VtableColumn[]): string {
	const writerJoin = columns.includes("writer_key")
		? `
		LEFT JOIN lix_internal_state_writer ws_txn ON
			ws_txn.file_id = txn.file_id AND
			ws_txn.entity_id = txn.entity_id AND
			ws_txn.schema_key = txn.schema_key AND
			ws_txn.version_id = txn.version_id`
		: "";

	return stripIndent(`
		-- 1. Transaction state (highest priority) - pending changes
		SELECT ${projectColumns(columns, TRANSACTION_COLUMN_EXPRESSIONS)}
		FROM lix_internal_transaction_state txn${writerJoin}
	`);
}

function buildUntrackedSegment(columns: readonly VtableColumn[]): string {
	const writerJoin = columns.includes("writer_key")
		? `
		LEFT JOIN lix_internal_state_writer ws_untracked ON
			ws_untracked.file_id = u.file_id AND
			ws_untracked.entity_id = u.entity_id AND
			ws_untracked.schema_key = u.schema_key AND
			ws_untracked.version_id = u.version_id`
		: "";

	return stripIndent(`
		-- 2. Untracked state (second priority) - only if no transaction exists
		SELECT ${projectColumns(columns, UNTRACKED_COLUMN_EXPRESSIONS)}
		FROM lix_internal_state_all_untracked u${writerJoin}
		WHERE (
			(u.is_tombstone = 0 AND u.snapshot_content IS NOT NULL) OR
			(u.is_tombstone = 1 AND u.snapshot_content IS NULL)
		)
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_transaction_state t
				WHERE t.version_id = u.version_id
					AND t.file_id = u.file_id
					AND t.schema_key = u.schema_key
					AND t.entity_id = u.entity_id
			)
	`);
}

function buildCachedSegment(columns: readonly VtableColumn[]): string {
	const metadataJoin = columns.includes("metadata")
		? `
		LEFT JOIN change ch ON ch.id = c.change_id`
		: "";
	const writerJoin = columns.includes("writer_key")
		? `
		LEFT JOIN lix_internal_state_writer ws_cache ON
			ws_cache.file_id = c.file_id AND
			ws_cache.entity_id = c.entity_id AND
			ws_cache.schema_key = c.schema_key AND
			ws_cache.version_id = c.version_id`
		: "";

	return stripIndent(`
		-- 3. Tracked state from cache (third priority) - only if no transaction or untracked exists
		SELECT ${projectColumns(columns, CACHED_COLUMN_EXPRESSIONS)}
		FROM ${CACHE_SOURCE_TOKEN} c${metadataJoin}${writerJoin}
		WHERE (
			(c.is_tombstone = 0 AND c.snapshot_content IS NOT NULL) OR
			(c.is_tombstone = 1 AND c.snapshot_content IS NULL)
		)
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_transaction_state t
				WHERE t.version_id = c.version_id
					AND t.file_id = c.file_id
					AND t.schema_key = c.schema_key
					AND t.entity_id = c.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_state_all_untracked u
				WHERE u.version_id = c.version_id
					AND u.file_id = c.file_id
					AND u.schema_key = c.schema_key
					AND u.entity_id = c.entity_id
			)
	`);
}

function buildInheritedCacheSegment(columns: readonly VtableColumn[]): string {
	const metadataJoin = columns.includes("metadata")
		? `
		LEFT JOIN change ch ON ch.id = isc.change_id`
		: "";
	const writerJoin = columns.includes("writer_key")
		? `
		LEFT JOIN lix_internal_state_writer ws_child ON
			ws_child.file_id = isc.file_id AND
			ws_child.entity_id = isc.entity_id AND
			ws_child.schema_key = isc.schema_key AND
			ws_child.version_id = vi.version_id
		LEFT JOIN lix_internal_state_writer ws_parent ON
			ws_parent.file_id = isc.file_id AND
			ws_parent.entity_id = isc.entity_id AND
			ws_parent.schema_key = isc.schema_key AND
			ws_parent.version_id = isc.version_id`
		: "";

	return stripIndent(`
		-- 4. Inherited tracked state (fourth priority)
		SELECT ${projectColumns(columns, INHERITED_CACHE_COLUMN_EXPRESSIONS)}
		FROM version_inheritance vi
		JOIN ${CACHE_SOURCE_TOKEN} isc ON isc.version_id = vi.ancestor_version_id${metadataJoin}${writerJoin}
		WHERE isc.is_tombstone = 0
			AND isc.snapshot_content IS NOT NULL
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_transaction_state t
				WHERE t.version_id = vi.version_id
					AND t.file_id = isc.file_id
					AND t.schema_key = isc.schema_key
					AND t.entity_id = isc.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM ${CACHE_SOURCE_TOKEN} child_isc
				WHERE child_isc.version_id = vi.version_id
					AND child_isc.file_id = isc.file_id
					AND child_isc.schema_key = isc.schema_key
					AND child_isc.entity_id = isc.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_state_all_untracked child_unt
				WHERE child_unt.version_id = vi.version_id
					AND child_unt.file_id = isc.file_id
					AND child_unt.schema_key = isc.schema_key
					AND child_unt.entity_id = isc.entity_id
			)
	`);
}

function buildInheritedUntrackedSegment(
	columns: readonly VtableColumn[]
): string {
	const writerJoin = columns.includes("writer_key")
		? `
		LEFT JOIN lix_internal_state_writer ws_child ON
			ws_child.file_id = unt.file_id AND
			ws_child.entity_id = unt.entity_id AND
			ws_child.schema_key = unt.schema_key AND
			ws_child.version_id = vi.version_id
		LEFT JOIN lix_internal_state_writer ws_parent ON
			ws_parent.file_id = unt.file_id AND
			ws_parent.entity_id = unt.entity_id AND
			ws_parent.schema_key = unt.schema_key AND
			ws_parent.version_id = unt.version_id`
		: "";

	return stripIndent(`
		-- 5. Inherited untracked state (lowest priority)
		SELECT ${projectColumns(columns, INHERITED_UNTRACKED_COLUMN_EXPRESSIONS)}
		FROM version_inheritance vi
		JOIN lix_internal_state_all_untracked unt ON unt.version_id = vi.ancestor_version_id${writerJoin}
		WHERE unt.is_tombstone = 0
			AND unt.snapshot_content IS NOT NULL
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_transaction_state t
				WHERE t.version_id = vi.version_id
					AND t.file_id = unt.file_id
					AND t.schema_key = unt.schema_key
					AND t.entity_id = unt.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM ${CACHE_SOURCE_TOKEN} child_isc
				WHERE child_isc.version_id = vi.version_id
					AND child_isc.file_id = unt.file_id
					AND child_isc.schema_key = unt.schema_key
					AND child_isc.entity_id = unt.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_state_all_untracked child_unt
				WHERE child_unt.version_id = vi.version_id
					AND child_unt.file_id = unt.file_id
					AND child_unt.schema_key = unt.schema_key
					AND child_unt.entity_id = unt.entity_id
			)
	`);
}

function buildInheritedTransactionSegment(
	columns: readonly VtableColumn[]
): string {
	const writerJoin = columns.includes("writer_key")
		? `
		LEFT JOIN lix_internal_state_writer ws_child ON
			ws_child.file_id = txn.file_id AND
			ws_child.entity_id = txn.entity_id AND
			ws_child.schema_key = txn.schema_key AND
			ws_child.version_id = vi.version_id
		LEFT JOIN lix_internal_state_writer ws_parent ON
			ws_parent.file_id = txn.file_id AND
			ws_parent.entity_id = txn.entity_id AND
			ws_parent.schema_key = txn.schema_key AND
			ws_parent.version_id = vi.parent_version_id`
		: "";

	return stripIndent(`
		-- 6. Inherited transaction state
		SELECT ${projectColumns(columns, INHERITED_TRANSACTION_COLUMN_EXPRESSIONS)}
		FROM version_parent vi
		JOIN lix_internal_transaction_state txn ON txn.version_id = vi.parent_version_id${writerJoin}
		WHERE vi.parent_version_id IS NOT NULL
			AND txn.snapshot_content IS NOT NULL
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_transaction_state child_txn
				WHERE child_txn.version_id = vi.version_id
					AND child_txn.file_id = txn.file_id
					AND child_txn.schema_key = txn.schema_key
					AND child_txn.entity_id = txn.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM ${CACHE_SOURCE_TOKEN} child_isc
				WHERE child_isc.version_id = vi.version_id
					AND child_isc.file_id = txn.file_id
					AND child_isc.schema_key = txn.schema_key
					AND child_isc.entity_id = txn.entity_id
			)
			AND NOT EXISTS (
				SELECT 1 FROM lix_internal_state_all_untracked child_unt
				WHERE child_unt.version_id = vi.version_id
					AND child_unt.file_id = txn.file_id
					AND child_unt.schema_key = txn.schema_key
					AND child_unt.entity_id = txn.entity_id
			)
	`);
}

function projectColumns(
	columns: readonly VtableColumn[],
	expressions: Record<VtableColumn, string>
): string {
	return columns.map((column) => expressions[column]).join(",\n\t\t");
}

function stripIndent(value: string): string {
	const trimmed = value.replace(/^\n+/, "").replace(/\n+$/, "");
	const lines = trimmed.split("\n");
	const indents = lines
		.filter((line) => line.trim().length > 0)
		.map((line) => line.match(/^\s*/)?.[0]?.length ?? 0);
	const minIndent = indents.length > 0 ? Math.min(...indents) : 0;
	return lines.map((line) => line.slice(minIndent)).join("\n");
}
