import type { LixChangeRaw } from "../../change/schema-definition.js";
import type { LixEngine } from "../../engine/boot.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";
import { getStoredSchema } from "../../stored-schema/get-stored-schema.js";
import type { MaterializedState as MaterializedChange } from "../vtable/generate-commit.js";
import {
	createSchemaCacheTableV2,
	getSchemaPropertyColumnNames,
	getSchemaVersion,
	propertyNameToColumn,
	schemaKeyToCacheTableNameV2,
} from "./create-schema-cache-table.js";
import {
	getStateCacheV2Tables,
	getStateCacheV2Columns,
	registerStateCacheV2TableMetadata,
} from "./schema.js";
import { CACHE_COLUMNS, PRIMARY_KEY_COLUMNS } from "./cache-columns.js";
import { LixStoredSchemaSchema } from "../../stored-schema/schema-definition.js";
import {
	LixCommitEdgeSchema,
	type LixCommitEdge,
} from "../../commit/schema-definition.js";
import {
	LixChangeSetSchema,
	type LixChangeSet,
} from "../../change-set/schema-definition.js";
import {
	registerStateCacheSchemaProperties,
	type CacheSchemaPropertyMetadata,
} from "./schema-metadata.js";
import {
	extractPrimaryType,
	extractPropertySchema,
} from "./sqlite-type-mapper.js";

type CacheChange = LixChangeRaw | MaterializedChange;
type CacheChangeEntry = {
	row: CacheChange;
	snapshot?: Record<string, unknown>;
};
type SchemaMetadata = {
	schema: LixSchemaDefinition;
	schemaVersion: string;
	tableName: string;
	propertyColumns: readonly string[];
	propertyColumnSet: Set<string>;
};

/**
 * Memoizes per-engine schema metadata—schema definition, version, cache table name, and property columns—
 * keyed by `runtimeCacheRef` so we can reuse it across updateStateCacheV2 runs.
 */
const schemaMetadataCacheMap = new WeakMap<
	object,
	Map<string, SchemaMetadata>
>();

function getSchemaMetadataCache(args: {
	engine: Pick<LixEngine, "runtimeCacheRef">;
}): Map<string, SchemaMetadata> {
	let cache = schemaMetadataCacheMap.get(args.engine.runtimeCacheRef);
	if (!cache) {
		cache = new Map<string, SchemaMetadata>();
		schemaMetadataCacheMap.set(args.engine.runtimeCacheRef, cache);
	}
	return cache;
}

/**
 * Updates the state cache v2 directly to physical tables, bypassing the virtual table.
 *
 * @example
 * updateStateCacheV2({
 *   engine,
 *   changes: [change1, change2],
 *   commit_id: "commit-123",
 *   version_id: "v1"
 * });
 */
export function updateStateCacheV2(args: {
	engine: Pick<
		LixEngine,
		"executeSync" | "runtimeCacheRef" | "hooks" | "sqlite"
	>;
	changes: Array<CacheChange>;
	commit_id?: string;
	version_id?: string;
}): void {
	const { engine, changes } = args;

	if (!changes || changes.length === 0) {
		return;
	}

	const grouped = new Map<
		string,
		{ inserts: CacheChangeEntry[]; deletes: CacheChangeEntry[] }
	>();

	for (const change of changes) {
		const snapshot =
			change.snapshot_content === null
				? undefined
				: (JSON.parse(change.snapshot_content) as Record<string, unknown>);

		if (change.schema_key === LixStoredSchemaSchema["x-lix-key"]) {
			if (snapshot) {
				const schemaCandidate = (snapshot as { value?: unknown }).value;
				if (
					schemaCandidate &&
					typeof schemaCandidate === "object" &&
					!Array.isArray(schemaCandidate)
				) {
					const schemaDefinition = schemaCandidate as LixSchemaDefinition;
					const schemaKey = schemaDefinition["x-lix-key"];
					if (typeof schemaKey === "string" && schemaKey.length > 0) {
						initializeSchemaMetadata({
							engine,
							schemaKey,
							schema: schemaDefinition,
						});
					}
				}
			}
			continue;
		}

		const bucket = grouped.get(change.schema_key) ?? {
			inserts: [],
			deletes: [],
		};
		if (change.snapshot_content === null) {
			bucket.deletes.push({ row: change });
		} else {
			bucket.inserts.push({ row: change, snapshot });
		}
		grouped.set(change.schema_key, bucket);
	}

	for (const [schemaKey, { inserts, deletes }] of grouped) {
		const metadata = resolveSchemaMetadata({
			engine,
			schemaKey,
		});

		if (inserts.length > 0) {
			upsertCacheRows({
				engine,
				tableName: metadata.tableName,
				rows: inserts,
				defaultCommitId: args.commit_id,
				defaultVersionId: args.version_id,
				propertyColumns: metadata.propertyColumns,
				propertyColumnSet: metadata.propertyColumnSet,
				tombstone: false,
			});

			if (schemaKey === "lix_commit") {
				upsertDerivedCommitEntities({
					engine,
					changes: inserts.map(({ row }) => row),
					defaultCommitId: args.commit_id,
				});
			}
		}

		if (deletes.length > 0) {
			upsertCacheRows({
				engine,
				tableName: metadata.tableName,
				rows: deletes,
				defaultCommitId: args.commit_id,
				defaultVersionId: args.version_id,
				propertyColumns: metadata.propertyColumns,
				propertyColumnSet: metadata.propertyColumnSet,
				tombstone: true,
			});
		}
	}
}

function upsertCacheRows(args: {
	engine: Pick<
		LixEngine,
		"executeSync" | "runtimeCacheRef" | "hooks" | "sqlite"
	>;
	tableName: string;
	rows: CacheChangeEntry[];
	defaultCommitId?: string;
	defaultVersionId?: string;
	propertyColumns: readonly string[];
	propertyColumnSet: Set<string>;
	tombstone: boolean;
}): void {
	const {
		engine,
		tableName,
		rows,
		defaultCommitId,
		defaultVersionId,
		propertyColumns,
		propertyColumnSet,
		tombstone,
	} = args;

	const processed = rows.map(({ row, snapshot }) =>
		processChange({
			row,
			defaultCommitId,
			defaultVersionId,
			tombstone,
			propertyColumns: propertyColumnSet,
			snapshot,
		})
	);

	if (processed.length === 0) {
		return;
	}

	const allColumns = [...CACHE_COLUMNS, ...propertyColumns];
	const columnList = allColumns.join(", ");
	const updateColumns = allColumns.filter(
		(column) =>
			!PRIMARY_KEY_COLUMNS.includes(column as any) &&
			column !== "lixcol_created_at"
	);

	const placeholders = allColumns.map(() => "?").join(", ");
	const updateAssignments = updateColumns
		.map((column) => `${column} = excluded.${column}`)
		.join(", ");

	const sql = `INSERT INTO ${tableName} (${columnList}) VALUES (${placeholders})
	ON CONFLICT(lixcol_entity_id, lixcol_file_id, lixcol_version_id) DO UPDATE SET ${updateAssignments}`;

	const stmt = engine.sqlite.prepare(sql);
	// updateStateCacheV2 executes inside the engine's transaction scope; no local BEGIN/COMMIT.
	for (const change of processed) {
		stmt.bind([
			change.lixcol_entity_id,
			change.lixcol_schema_key,
			change.lixcol_file_id,
			change.lixcol_version_id,
			change.lixcol_plugin_key,
			change.lixcol_schema_version,
			change.lixcol_created_at,
			change.lixcol_updated_at,
			change.lixcol_inherited_from_version_id ?? null,
			tombstone ? 1 : 0,
			change.lixcol_change_id,
			change.lixcol_commit_id,
			...propertyColumns.map((column) =>
				tombstone
					? null
					: change.propertyValues.has(column)
						? change.propertyValues.get(column)
						: null
			),
		]);
		stmt.step();
		stmt.reset();
	}
	stmt.finalize();
}

/**
 * Materializes derived commit entities (edges and change-sets) from the normalized cache.
 *
 * @example
 * upsertDerivedCommitEntities({
 *   engine,
 *   changes,
 *   defaultCommitId: "commit-123",
 * });
 */
function upsertDerivedCommitEntities(args: {
	engine: Pick<
		LixEngine,
		"executeSync" | "runtimeCacheRef" | "hooks" | "sqlite"
	>;
	changes: CacheChange[];
	defaultCommitId?: string;
}): void {
	const { engine, changes, defaultCommitId } = args;

	if (changes.length === 0) {
		return;
	}

	const edgeMetadata = resolveSchemaMetadata({
		engine,
		schemaKey: "lix_commit_edge",
	});
	const changeSetMetadata = resolveSchemaMetadata({
		engine,
		schemaKey: "lix_change_set",
	});

	const edgeRows: LixChangeRaw[] = [];
	const changeSetRows: LixChangeRaw[] = [];

	for (const change of changes) {
		const parsed = JSON.parse(change.snapshot_content as string) as Record<
			string,
			unknown
		>;

		const childId = String(parsed.id);

		const parents = Array.isArray((parsed as any).parent_commit_ids)
			? (parsed as any).parent_commit_ids.map((parent: unknown) =>
					String(parent)
				)
			: [];
		const changeSetId = (parsed as any).change_set_id
			? String((parsed as any).change_set_id)
			: undefined;

		if (parents.length > 0) {
			engine.executeSync({
				sql: `DELETE FROM ${edgeMetadata.tableName} WHERE lixcol_version_id = 'global' AND child_id = ?`,
				parameters: [childId],
			});
		}

		for (const parentId of parents) {
			const edgeRow = {
				id: change.id,
				entity_id: `${parentId}~${childId}`,
				schema_key: LixCommitEdgeSchema["x-lix-key"],
				schema_version: LixCommitEdgeSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					parent_id: parentId,
					child_id: childId,
				} satisfies LixCommitEdge),
				created_at: change.created_at,
			} as LixChangeRaw;
			(edgeRow as any).lixcol_version_id = "global";
			(edgeRow as any).lixcol_commit_id = (defaultCommitId as any) ?? childId;
			edgeRows.push(edgeRow);
		}

		if (changeSetId) {
			const changeSetRow = {
				id: change.id,
				entity_id: changeSetId,
				schema_key: LixChangeSetSchema["x-lix-key"],
				schema_version: LixChangeSetSchema["x-lix-version"],
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: changeSetId,
				} satisfies LixChangeSet),
				created_at: change.created_at,
			} as LixChangeRaw;
			(changeSetRow as any).lixcol_version_id = "global";
			(changeSetRow as any).lixcol_commit_id =
				(defaultCommitId as any) ?? childId;
			changeSetRows.push(changeSetRow);
		}
	}

	if (edgeRows.length > 0) {
		upsertCacheRows({
			engine,
			tableName: edgeMetadata.tableName,
			rows: edgeRows.map((row) => ({ row })),
			defaultCommitId: defaultCommitId,
			defaultVersionId: "global",
			propertyColumns: edgeMetadata.propertyColumns,
			propertyColumnSet: edgeMetadata.propertyColumnSet,
			tombstone: false,
		});
	}

	if (changeSetRows.length > 0) {
		upsertCacheRows({
			engine,
			tableName: changeSetMetadata.tableName,
			rows: changeSetRows.map((row) => ({ row })),
			defaultCommitId: defaultCommitId,
			defaultVersionId: "global",
			propertyColumns: changeSetMetadata.propertyColumns,
			propertyColumnSet: changeSetMetadata.propertyColumnSet,
			tombstone: false,
		});
	}
}

function requireSchemaDefinition(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">;
	schemaKey: string;
}): LixSchemaDefinition {
	const schema = getStoredSchema({ engine: args.engine, key: args.schemaKey });
	if (!schema) {
		throw new Error(
			`updateStateCacheV2: stored schema not found for schema_key "${args.schemaKey}"`
		);
	}
	return schema;
}

function processChange(args: {
	row: CacheChange;
	defaultCommitId?: string;
	defaultVersionId?: string;
	tombstone: boolean;
	propertyColumns: Set<string>;
	snapshot?: Record<string, unknown>;
}) {
	const {
		row,
		defaultCommitId,
		defaultVersionId,
		tombstone,
		propertyColumns,
		snapshot,
	} = args;
	const rowAny = row as any;

	const resolvedVersionId =
		rowAny.lixcol_version_id ?? rowAny.version_id ?? defaultVersionId;
	if (!resolvedVersionId) {
		throw new Error(
			"updateStateCacheV2: version_id missing; provide inline lixcol_version_id or top-level version_id"
		);
	}

	const resolvedCommitId =
		rowAny.lixcol_commit_id ?? defaultCommitId ?? rowAny.commit_id;
	if (!resolvedCommitId) {
		throw new Error(
			"updateStateCacheV2: commit_id missing; provide inline lixcol_commit_id or top-level commit_id"
		);
	}

	const inheritedFrom =
		rowAny.lixcol_inherited_from_version_id ??
		rowAny.inherited_from_version_id ??
		null;

	const snapshotObject = tombstone
		? {}
		: (snapshot ??
			(JSON.parse(row.snapshot_content as string) as Record<string, unknown>));

	const propertyValues = new Map<string, unknown>();
	for (const [key, value] of Object.entries(snapshotObject ?? {})) {
		const column = propertyNameToColumn(key);
		if (propertyColumns.has(column)) {
			propertyValues.set(column, formatPropertyValue(value));
		}
	}

	return {
		lixcol_entity_id: row.entity_id,
		lixcol_schema_key: row.schema_key,
		lixcol_file_id: row.file_id,
		lixcol_version_id: resolvedVersionId,
		lixcol_plugin_key: row.plugin_key,
		lixcol_schema_version: row.schema_version,
		lixcol_created_at: row.created_at,
		lixcol_updated_at: row.created_at,
		lixcol_inherited_from_version_id: inheritedFrom,
		lixcol_change_id: row.id,
		lixcol_commit_id: resolvedCommitId,
		propertyValues,
	};
}

function resolveSchemaMetadata(args: {
	engine: Pick<
		LixEngine,
		"executeSync" | "runtimeCacheRef" | "hooks" | "sqlite"
	>;
	schemaKey: string;
}): SchemaMetadata {
	const cache = getSchemaMetadataCache({ engine: args.engine });
	const cached = cache.get(args.schemaKey);
	if (cached) return cached;

	const schemaDefinition = requireSchemaDefinition({
		engine: args.engine,
		schemaKey: args.schemaKey,
	});

	return initializeSchemaMetadata({
		engine: args.engine,
		schemaKey: args.schemaKey,
		schema: schemaDefinition,
	});
}

function initializeSchemaMetadata(args: {
	engine: Pick<
		LixEngine,
		"executeSync" | "runtimeCacheRef" | "hooks" | "sqlite"
	>;
	schemaKey: string;
	schema: LixSchemaDefinition;
}): SchemaMetadata {
	const schemaVersion = getSchemaVersion(args.schema);
	const tableName = schemaKeyToCacheTableNameV2(args.schemaKey, schemaVersion);
	const tables = getStateCacheV2Tables({ engine: args.engine });

	createSchemaCacheTableV2({
		engine: args.engine,
		schema: args.schema,
		tableName,
	});

	if (!tables.has(tableName)) {
		tables.add(tableName);
	}

	registerStateCacheV2TableMetadata({
		engine: args.engine,
		tableName,
		schemaKey: args.schemaKey,
		schemaVersion,
	});

	getStateCacheV2Columns({ engine: args.engine, tableName });

	const propertyColumns = Array.from(
		new Set(getSchemaPropertyColumnNames(args.schema))
	).sort();

	registerStateCacheSchemaProperties({
		schemaKey: args.schemaKey,
		schemaVersion,
		properties: buildSchemaPropertyMetadata(args.schema),
	});
	const metadata: SchemaMetadata = {
		schema: args.schema,
		schemaVersion,
		tableName,
		propertyColumns,
		propertyColumnSet: new Set(propertyColumns),
	};

	getSchemaMetadataCache({ engine: args.engine }).set(args.schemaKey, metadata);
	return metadata;
}

function buildSchemaPropertyMetadata(
	schema: LixSchemaDefinition
): CacheSchemaPropertyMetadata[] {
	const properties = (schema as Record<string, unknown>)?.properties;
	if (!properties || typeof properties !== "object") {
		return [];
	}

	const metadata: CacheSchemaPropertyMetadata[] = [];
	for (const key of Object.keys(properties)) {
		const definition = extractPropertySchema(schema, key);
		const primaryType = extractPrimaryType(definition);
		metadata.push({
			propertyName: key,
			columnName: propertyNameToColumn(key),
			valueKind: mapPrimaryTypeToValueKind(primaryType),
		});
	}
	return metadata;
}

function mapPrimaryTypeToValueKind(
	primaryType: string | null
): CacheSchemaPropertyMetadata["valueKind"] {
	switch (primaryType) {
		case "integer":
			return "integer";
		case "number":
			return "number";
		case "boolean":
			return "boolean";
		case "array":
		case "object":
			return "json";
		case "string":
		default:
			return "string";
	}
}

function formatPropertyValue(value: unknown): unknown {
	if (value === null || value === undefined) return null;
	if (typeof value === "boolean") return value ? 1 : 0;
	if (typeof value === "object") return JSON.stringify(value);
	return value;
}
