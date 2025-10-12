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
import { getStateCacheV2Tables, getStateCacheV2Columns } from "./schema.js";
import { LixStoredSchemaSchema } from "../../stored-schema/schema-definition.js";

const PRIMARY_KEY_COLUMNS = [
	"lixcol_entity_id",
	"lixcol_file_id",
	"lixcol_version_id",
] as const;

const BASE_INSERT_COLUMNS = [
	"lixcol_entity_id",
	"lixcol_schema_key",
	"lixcol_file_id",
	"lixcol_version_id",
	"lixcol_plugin_key",
	"lixcol_schema_version",
	"lixcol_created_at",
	"lixcol_updated_at",
	"lixcol_inherited_from_version_id",
	"lixcol_is_tombstone",
	"lixcol_change_id",
	"lixcol_commit_id",
] as const;

type CacheChange = LixChangeRaw | MaterializedChange;

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

	const schemaMetadataCache = new Map<string, SchemaMetadata>();

	const grouped = new Map<
		string,
		{ inserts: CacheChange[]; deletes: CacheChange[] }
	>();

	for (const change of changes) {
		if (change.schema_key === LixStoredSchemaSchema["x-lix-key"]) {
			if (change.snapshot_content !== null) {
				const storedSnapshot = extractSnapshotObject(change.snapshot_content);
				const schemaCandidate = storedSnapshot?.value;
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
							cache: schemaMetadataCache,
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
			bucket.deletes.push(change);
		} else {
			bucket.inserts.push(change);
		}
		grouped.set(change.schema_key, bucket);
	}

	for (const [schemaKey, { inserts, deletes }] of grouped) {
		const metadata = resolveSchemaMetadata({
			engine,
			schemaKey,
			cache: schemaMetadataCache,
		});

		if (inserts.length > 0) {
			insertRows({
				engine,
				tableName: metadata.tableName,
				rows: inserts,
				defaultCommitId: args.commit_id,
				defaultVersionId: args.version_id,
				propertyColumns: metadata.propertyColumns,
				propertyColumnSet: metadata.propertyColumnSet,
			});

			if (schemaKey === "lix_commit") {
				deriveCommitArtifacts({
					engine,
					changes: inserts,
					defaultCommitId: args.commit_id,
					cache: schemaMetadataCache,
				});
			}
		}

		if (deletes.length > 0) {
			insertTombstones({
				engine,
				tableName: metadata.tableName,
				rows: deletes,
				defaultCommitId: args.commit_id,
				defaultVersionId: args.version_id,
				propertyColumns: metadata.propertyColumns,
				propertyColumnSet: metadata.propertyColumnSet,
			});
		}
	}
}

function insertRows(args: {
	engine: Pick<
		LixEngine,
		"executeSync" | "runtimeCacheRef" | "hooks" | "sqlite"
	>;
	tableName: string;
	rows: CacheChange[];
	defaultCommitId?: string;
	defaultVersionId?: string;
	propertyColumns: readonly string[];
	propertyColumnSet: Set<string>;
}): void {
	const { engine, tableName, rows, defaultCommitId, defaultVersionId } = args;
	const propertyColumnOrder = args.propertyColumns;
	const propertyColumnSet = args.propertyColumnSet;

	const processed = rows.map((row) =>
		processChange({
			row,
			defaultCommitId,
			defaultVersionId,
			tombstone: false,
			propertyColumns: propertyColumnSet,
		})
	);

	if (processed.length === 0) {
		return;
	}

	const allColumns = [...BASE_INSERT_COLUMNS, ...propertyColumnOrder];
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
	engine.sqlite.exec("BEGIN");
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
			0,
			change.lixcol_change_id,
			change.lixcol_commit_id,
			...propertyColumnOrder.map((column) =>
				change.propertyValues.has(column)
					? change.propertyValues.get(column)
					: null
			),
		]);
		stmt.step();
		stmt.reset();
	}
	engine.sqlite.exec("COMMIT");
	stmt.finalize();
}

function insertTombstones(args: {
	engine: Pick<
		LixEngine,
		"executeSync" | "runtimeCacheRef" | "hooks" | "sqlite"
	>;
	tableName: string;
	rows: CacheChange[];
	defaultCommitId?: string;
	defaultVersionId?: string;
	propertyColumns: readonly string[];
	propertyColumnSet: Set<string>;
}): void {
	const { engine, tableName, rows, defaultCommitId, defaultVersionId } = args;
	const propertyColumnOrder = args.propertyColumns;
	const propertyColumnSet = args.propertyColumnSet;

	const processed = rows.map((row) =>
		processChange({
			row,
			defaultCommitId,
			defaultVersionId,
			tombstone: true,
			propertyColumns: propertyColumnSet,
		})
	);

	if (processed.length === 0) {
		return;
	}

	const allColumns = [...BASE_INSERT_COLUMNS, ...propertyColumnOrder];
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
	engine.sqlite.exec("BEGIN");
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
			1,
			change.lixcol_change_id,
			change.lixcol_commit_id,
			...propertyColumnOrder.map(() => null),
		]);
		stmt.step();
		stmt.reset();
	}
	engine.sqlite.exec("COMMIT");
	stmt.finalize();
}

function deriveCommitArtifacts(args: {
	engine: Pick<
		LixEngine,
		"executeSync" | "runtimeCacheRef" | "hooks" | "sqlite"
	>;
	changes: CacheChange[];
	defaultCommitId?: string;
	cache: Map<string, SchemaMetadata>;
}): void {
	const { engine, changes, defaultCommitId, cache } = args;

	if (changes.length === 0) {
		return;
	}

	const edgeMetadata = resolveSchemaMetadata({
		engine,
		schemaKey: "lix_commit_edge",
		cache,
	});
	const changeSetMetadata = resolveSchemaMetadata({
		engine,
		schemaKey: "lix_change_set",
		cache,
	});

	const edgeRows: LixChangeRaw[] = [];
	const changeSetRows: LixChangeRaw[] = [];

	for (const change of changes) {
		const parsed = extractSnapshotObject(change.snapshot_content);
		if (
			!parsed ||
			typeof (parsed as Record<string, unknown>).id === "undefined"
		) {
			continue;
		}

		const childId = String((parsed as Record<string, unknown>).id);

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
				schema_key: "lix_commit_edge",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					parent_id: parentId,
					child_id: childId,
				}),
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
				schema_key: "lix_change_set",
				schema_version: "1.0",
				file_id: "lix",
				plugin_key: "lix_own_entity",
				snapshot_content: JSON.stringify({
					id: changeSetId,
					metadata: null,
				}),
				created_at: change.created_at,
			} as LixChangeRaw;
			(changeSetRow as any).lixcol_version_id = "global";
			(changeSetRow as any).lixcol_commit_id =
				(defaultCommitId as any) ?? childId;
			changeSetRows.push(changeSetRow);
		}
	}

	if (edgeRows.length > 0) {
		insertRows({
			engine,
			tableName: edgeMetadata.tableName,
			rows: edgeRows,
			defaultCommitId: defaultCommitId,
			defaultVersionId: "global",
			propertyColumns: edgeMetadata.propertyColumns,
			propertyColumnSet: edgeMetadata.propertyColumnSet,
		});
	}

	if (changeSetRows.length > 0) {
		insertRows({
			engine,
			tableName: changeSetMetadata.tableName,
			rows: changeSetRows,
			defaultCommitId: defaultCommitId,
			defaultVersionId: "global",
			propertyColumns: changeSetMetadata.propertyColumns,
			propertyColumnSet: changeSetMetadata.propertyColumnSet,
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
}) {
	const { row, defaultCommitId, defaultVersionId, tombstone, propertyColumns } =
		args;
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
		: extractSnapshotObject(row.snapshot_content);

	const propertyValues = new Map<string, unknown>();
	for (const [key, value] of Object.entries(snapshotObject ?? {})) {
		const column = propertyColumnName(key);
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

type SchemaMetadata = {
	schema: LixSchemaDefinition;
	schemaVersion: string;
	tableName: string;
	propertyColumns: readonly string[];
	propertyColumnSet: Set<string>;
};

function resolveSchemaMetadata(args: {
	engine: Pick<
		LixEngine,
		"executeSync" | "runtimeCacheRef" | "hooks" | "sqlite"
	>;
	schemaKey: string;
	cache: Map<string, SchemaMetadata>;
}): SchemaMetadata {
	const cached = args.cache.get(args.schemaKey);
	if (cached) return cached;

	const schemaDefinition = requireSchemaDefinition({
		engine: args.engine,
		schemaKey: args.schemaKey,
	});

	return initializeSchemaMetadata({
		engine: args.engine,
		schemaKey: args.schemaKey,
		schema: schemaDefinition,
		cache: args.cache,
	});
}

function initializeSchemaMetadata(args: {
	engine: Pick<
		LixEngine,
		"executeSync" | "runtimeCacheRef" | "hooks" | "sqlite"
	>;
	schemaKey: string;
	schema: LixSchemaDefinition;
	cache: Map<string, SchemaMetadata>;
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

	getStateCacheV2Columns({ engine: args.engine, tableName });

	const propertyColumns = Array.from(
		new Set(getSchemaPropertyColumnNames(args.schema))
	).sort();
	const metadata: SchemaMetadata = {
		schema: args.schema,
		schemaVersion,
		tableName,
		propertyColumns,
		propertyColumnSet: new Set(propertyColumns),
	};

	args.cache.set(args.schemaKey, metadata);
	return metadata;
}

function extractSnapshotObject(
	raw: LixChangeRaw["snapshot_content"]
): Record<string, unknown> | undefined {
	if (raw === null || raw === undefined) {
		return undefined;
	}

	if (typeof raw === "object") {
		return raw as Record<string, unknown>;
	}

	if (typeof raw === "string") {
		const trimmed = raw.trim();
		if (trimmed.length === 0) return undefined;

		try {
			const parsed = JSON.parse(trimmed);
			if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
				return parsed as Record<string, unknown>;
			}
		} catch (error) {
			throw new Error(
				`updateStateCacheV2: snapshot_content is not valid JSON (${(error as Error).message})`
			);
		}
	}

	return undefined;
}

function formatPropertyValue(value: unknown): unknown {
	if (value === null || value === undefined) return null;
	if (typeof value === "boolean") return value ? 1 : 0;
	if (typeof value === "object") return JSON.stringify(value);
	return value;
}

function propertyColumnName(property: string): string {
	return propertyNameToColumn(property);
}
