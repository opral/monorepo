import type { LixEngine } from "../../engine/boot.js";
import type { LixChangeRaw } from "../../change/schema-definition.js";
import type { MaterializedState as MaterializedChange } from "../vtable/generate-commit.js";
import { getStateCacheTables } from "./schema.js";
import {
	createSchemaCacheTable,
	schemaKeyToCacheTableName,
} from "./create-schema-cache-table.js";
import { resolveCacheSchemaDefinition } from "./schema-resolver.js";

/**
 * Updates the state cache v2 directly to physical tables, bypassing the virtual table.
 *
 * This function writes directly to per-schema SQLite tables instead of going through
 * the vtable for two critical performance reasons:
 *
 * 1. **Minimizes JS <-> WASM overhead**: Direct table access avoids the vtable's
 *    row-by-row callback mechanism that crosses the JS/WASM boundary for each row.
 *
 * 2. **Enables efficient batching**: Vtables only support per-row logic, preventing
 *    batch optimizations like prepared statements, transactions, and bulk operations.
 *    Direct access allows us to batch hundreds of rows in a single transaction.
 *
 * The vtable (schema.ts) remains read-only for SELECT queries, providing a unified
 * query interface while mutations bypass it for ~50% better performance.
 *
 * This function handles:
 * - Direct writes to per-schema physical tables for optimal performance
 * - Batch inserting/updating cache entries
 * - Deletion copy-down operations for inheritance
 * - Tombstone management
 *
 * @example
 * updateStateCache({
 *   engine,
 *   changes: [change1, change2],
 *   commit_id: "commit-123",
 *   version_id: "v1"
 * });
 */
export function updateStateCache(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">;
	// Accepts standard changes or materialized changes which include inline
	// lixcol_version_id and lixcol_commit_id. When inline values are present,
	// they take precedence over top-level commit/version arguments.
	changes: Array<LixChangeRaw | MaterializedChange>;
	commit_id?: string;
	version_id?: string;
}): void {
	const engine = args.engine;
	const changes = args.changes;

	// Group changes by schema_key for efficient batch processing
	const changesBySchema = new Map<
		string,
		{
			inserts: LixChangeRaw[];
			deletes: LixChangeRaw[];
		}
	>();

	for (const change of changes) {
		if (!changesBySchema.has(change.schema_key)) {
			changesBySchema.set(change.schema_key, {
				inserts: [],
				deletes: [],
			});
		}

		const group = changesBySchema.get(change.schema_key)!;
		if (change.snapshot_content === null) {
			group.deletes.push(change);
		} else {
			group.inserts.push(change);
		}
	}

	// Process each schema's changes directly to its physical table
	for (const [schema_key, schemaChanges] of changesBySchema) {
		const tableName = ensureTableExists({
			engine,
			schemaKey: schema_key,
		});

		// Process inserts/updates for this schema
		if (schemaChanges.inserts.length > 0) {
			batchInsertDirectToTable({
				engine,
				tableName,
				changes: schemaChanges.inserts,
				default_commit_id: args.commit_id,
				default_version_id: args.version_id,
			});

			// Derive commit edges from commit.parent_commit_ids and write to global cache
			if (schema_key === "lix_commit") {
				// Build edge rows from each commit change
				const edgeRows: Array<LixChangeRaw> = [];
				const changeSetRows: Array<LixChangeRaw> = [];
				let edgeTableName: string | null = null;
				let changeSetTableName: string | null = null;
				for (const change of schemaChanges.inserts) {
					const snap = change.snapshot_content
						? JSON.parse(change.snapshot_content as any)
						: undefined;
					if (!snap || !snap.id) continue;
					const childId = String(snap.id);
					const parents: string[] = Array.isArray(snap.parent_commit_ids)
						? snap.parent_commit_ids.map((p: any) => String(p))
						: [];
					const changeSetId: string | undefined = snap.change_set_id
						? String(snap.change_set_id)
						: undefined;

					// Clear existing cached edges for this child in global scope
					if (edgeTableName === null) {
						edgeTableName = ensureTableExists({
							engine,
							schemaKey: "lix_commit_edge",
						});
					}
					engine.executeSync({
						sql: `DELETE FROM ${edgeTableName} WHERE version_id = 'global' AND json_extract(snapshot_content,'$.child_id') = ?`,
						parameters: [childId],
					});

					// Insert derived edges for parents
					for (const parentId of parents) {
						edgeRows.push({
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
							// Inline resolved columns for cache write
							// @ts-expect-error - materialized inline fields used by cache writer
							lixcol_version_id: "global",
							lixcol_commit_id: (args.commit_id as any) ?? childId,
						});
					}

					// Ensure the commit's change set exists in cache (global)
					if (changeSetId) {
						if (changeSetTableName === null) {
							changeSetTableName = ensureTableExists({
								engine,
								schemaKey: "lix_change_set",
							});
						}
						changeSetRows.push({
							id: change.id, // tie to the real commit change id
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
							// @ts-expect-error - inline cache hints
							lixcol_version_id: "global",
							lixcol_commit_id: (args.commit_id as any) ?? childId,
						});
					}
				}

				if (edgeRows.length > 0) {
					if (edgeTableName === null) {
						edgeTableName = ensureTableExists({
							engine,
							schemaKey: "lix_commit_edge",
						});
					}
					batchInsertDirectToTable({
						engine,
						tableName: edgeTableName,
						changes: edgeRows,
						default_commit_id: args.commit_id,
						default_version_id: "global",
					});
				}

				if (changeSetRows.length > 0) {
					if (changeSetTableName === null) {
						changeSetTableName = ensureTableExists({
							engine,
							schemaKey: "lix_change_set",
						});
					}
					batchInsertDirectToTable({
						engine,
						tableName: changeSetTableName,
						changes: changeSetRows,
						default_commit_id: args.commit_id,
						default_version_id: "global",
					});
				}
			}
		}

		// Process deletions for this schema
		if (schemaChanges.deletes.length > 0) {
			batchDeleteDirectFromTable({
				engine,
				tableName,
				changes: schemaChanges.deletes,
				default_commit_id: args.commit_id,
				default_version_id: args.version_id,
			});
		}
	}
}

/**
 * Ensures a schema-backed cache table exists and tracks it in the engine cache.
 */
function ensureTableExists(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef" | "hooks">;
	schemaKey: string;
}): string {
	const { engine, schemaKey } = args;
	const schemaDefinition = resolveCacheSchemaDefinition({
		engine,
		schemaKey,
	});
	if (!schemaDefinition) {
		throw new Error(`updateStateCache: missing stored schema for ${schemaKey}`);
	}
	const tableName = createSchemaCacheTable({
		engine,
		schema: schemaDefinition,
	});
	const tableCache = getStateCacheTables({ engine });
	if (!tableCache.has(tableName)) {
		tableCache.add(tableName);
	}
	const sanitized = schemaKeyToCacheTableName(schemaKey);
	if (!tableCache.has(sanitized)) {
		tableCache.add(sanitized);
	}
	return tableName;
}

function batchInsertDirectToTable(args: {
	engine: Pick<LixEngine, "executeSync" | "runtimeCacheRef">;
	tableName: string;
	changes: Array<LixChangeRaw | MaterializedChange>;
	default_commit_id?: string;
	default_version_id?: string;
}): void {
	const { engine, tableName, changes, default_commit_id, default_version_id } =
		args;

	for (const change of changes) {
		const change_any = change as any;
		const resolvedVersionId =
			change_any.lixcol_version_id ??
			change_any.version_id ??
			default_version_id;
		const resolvedCommitId = change_any.lixcol_commit_id ?? default_commit_id;

		if (!resolvedVersionId) {
			throw new Error(
				"updateStateCache: version_id missing; provide inline lixcol_version_id or top-level version_id"
			);
		}
		if (!resolvedCommitId) {
			throw new Error(
				"updateStateCache: commit_id missing; provide inline lixcol_commit_id or top-level commit_id"
			);
		}

		engine.executeSync({
			sql: `INSERT INTO ${tableName} (
			entity_id,
			schema_key,
			file_id,
			version_id,
			plugin_key,
			snapshot_content,
			schema_version,
			created_at,
			updated_at,
			inherited_from_version_id,
			is_tombstone,
			change_id,
			commit_id
		) VALUES (?, ?, ?, ?, ?, jsonb(?), ?, ?, ?, ?, ?, ?, ?)
		ON CONFLICT(entity_id, file_id, version_id) DO UPDATE SET
			schema_key = excluded.schema_key,
			plugin_key = excluded.plugin_key,
			snapshot_content = excluded.snapshot_content,
			schema_version = excluded.schema_version,
			updated_at = excluded.updated_at,
			inherited_from_version_id = excluded.inherited_from_version_id,
			is_tombstone = excluded.is_tombstone,
			change_id = excluded.change_id,
			commit_id = excluded.commit_id`,
			parameters: [
				change.entity_id,
				change.schema_key,
				change.file_id,
				resolvedVersionId,
				change.plugin_key,
				change.snapshot_content,
				change.schema_version,
				change.created_at,
				change.created_at,
				null,
				0,
				change.id,
				resolvedCommitId,
			],
		});
	}
}

function batchDeleteDirectFromTable(args: {
	engine: Pick<LixEngine, "executeSync">;
	tableName: string;
	changes: Array<LixChangeRaw | MaterializedChange>;
	default_commit_id?: string;
	default_version_id?: string;
}): void {
	const { engine, tableName, changes, default_commit_id, default_version_id } =
		args;

	for (const change of changes) {
		const change_any = change as any;
		const resolvedVersionId =
			change_any.lixcol_version_id ??
			change_any.version_id ??
			default_version_id;
		const resolvedCommitId = change_any.lixcol_commit_id ?? default_commit_id;

		if (!resolvedVersionId) {
			throw new Error(
				"updateStateCache: version_id missing; provide inline lixcol_version_id or top-level version_id"
			);
		}
		if (!resolvedCommitId) {
			throw new Error(
				"updateStateCache: commit_id missing; provide inline lixcol_commit_id or top-level commit_id"
			);
		}

		// Get existing entry to check if it exists before deletion
		const result = engine.executeSync({
			sql: `SELECT * FROM ${tableName} 
			      WHERE entity_id = ? AND file_id = ? AND version_id = ?
			      AND is_tombstone = 0 AND snapshot_content IS NOT NULL`,
			parameters: [change.entity_id, change.file_id, resolvedVersionId],
		}).rows;

		const existingEntry = result?.[0];

		// Delete the entry
		if (existingEntry) {
			engine.executeSync({
				sql: `DELETE FROM ${tableName} 
				      WHERE entity_id = ? AND file_id = ? AND version_id = ?`,
				parameters: [change.entity_id, change.file_id, resolvedVersionId],
			});
		}

		// Insert tombstone with UPSERT to handle existing entries
		engine.executeSync({
			sql: `INSERT INTO ${tableName} (
				entity_id,
				schema_key,
				file_id,
				version_id,
				plugin_key,
				snapshot_content,
				schema_version,
				created_at,
				updated_at,
				inherited_from_version_id,
				is_tombstone,
				change_id,
				commit_id
			) VALUES (?, ?, ?, ?, ?, NULL, ?, ?, ?, NULL, 1, ?, ?)
			ON CONFLICT(entity_id, file_id, version_id) DO UPDATE SET
				schema_key = excluded.schema_key,
				plugin_key = excluded.plugin_key,
				snapshot_content = NULL,
				schema_version = excluded.schema_version,
				updated_at = excluded.updated_at,
				inherited_from_version_id = NULL,
				is_tombstone = 1,
				change_id = excluded.change_id,
				commit_id = excluded.commit_id`,
			parameters: [
				change.entity_id,
				change.schema_key,
				change.file_id,
				resolvedVersionId,
				change.plugin_key,
				change.schema_version,
				change.created_at,
				change.created_at,
				change.id,
				resolvedCommitId,
			],
		});
	}
}
