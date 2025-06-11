import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { validateStateMutation } from "./validate-state-mutation.js";
import type { LixInternalDatabaseSchema } from "../database/schema.js";
import type { Kysely } from "kysely";
import { handleStateMutation } from "./handle-state-mutation.js";
import { createLixOwnLogSync } from "../log/create-lix-own-log.js";

export function applyStateDatabaseSchema(
	sqlite: SqliteWasmDatabase,
	db: Kysely<LixInternalDatabaseSchema>
): SqliteWasmDatabase {
	sqlite.createFunction({
		name: "validate_snapshot_content",
		deterministic: true,
		arity: 5,
		// @ts-expect-error - type mismatch
		xFunc: (_ctxPtr: number, ...args: any[]) => {
			return validateStateMutation({
				lix: { sqlite, db: db as any },
				schema: args[0] ? JSON.parse(args[0]) : null,
				snapshot_content: JSON.parse(args[1]),
				operation: args[2] || undefined,
				entity_id: args[3] || undefined,
				version_id: args[4],
			});
		},
	});

	sqlite.createFunction({
		name: "handle_state_mutation",
		arity: -1,
		xFunc: (_ctxPtr: number, ...args: any[]) => {
			return handleStateMutation(
				sqlite,
				db,
				args[0], // entity_id
				args[1], // schema_key
				args[2], // file_id
				args[3], // plugin_key
				args[4], // snapshot_content,
				args[5], // version_id
				args[6] // schema_version
			);
		},
	});

	// Create virtual table using the proper SQLite WASM API (following vtab-experiment pattern)
	const capi = sqlite.sqlite3.capi;
	const module = new capi.sqlite3_module();

	// Store cursor state
	const cursorStates = new Map();

	// Cache initialization state to avoid repeated table existence checks
	let loggingInitialized: boolean | null = null;

	const canLog = () => {
		if (loggingInitialized === null) {
			try {
				const tableExists = sqlite.exec({
					sql: "SELECT 1 FROM sqlite_master WHERE type='table' AND name='key_value'",
					returnValue: "resultRows",
				});
				loggingInitialized = tableExists && tableExists.length > 0;
			} catch {
				loggingInitialized = false;
			}
		}
		return loggingInitialized;
	};

	module.installMethods(
		{
			xCreate: (db: any, _pAux: any, _argc: number, _argv: any, pVTab: any) => {
				const sql = `CREATE TABLE x(
				entity_id TEXT,
				schema_key TEXT,
				file_id TEXT,
				version_id TEXT,
				plugin_key TEXT,
				snapshot_content TEXT,
				schema_version TEXT,
				created_at TEXT,
				updated_at TEXT,
				inherited_from_version_id TEXT
			)`;

				const result = capi.sqlite3_declare_vtab(db, sql);
				if (result !== capi.SQLITE_OK) {
					return result;
				}

				sqlite.sqlite3.vtab.xVtab.create(pVTab);
				return capi.SQLITE_OK;
			},

			xConnect: () => {
				return capi.SQLITE_OK;
			},

			xBestIndex: () => {
				return capi.SQLITE_OK;
			},

			xDisconnect: () => {
				return capi.SQLITE_OK;
			},

			xDestroy: () => {
				return capi.SQLITE_OK;
			},

			xOpen: (_pVTab: any, pCursor: any) => {
				const cursor = sqlite.sqlite3.vtab.xCursor.create(pCursor);
				cursorStates.set(cursor.pointer, {
					results: [],
					rowIndex: 0,
				});
				return capi.SQLITE_OK;
			},

			xClose: (pCursor: any) => {
				cursorStates.delete(pCursor);
				return capi.SQLITE_OK;
			},

			xFilter: (pCursor: any) => {
				const cursorState = cursorStates.get(pCursor);

				// Try cache first - include inherited entities via union
				const cacheResults = sqlite.exec({
					sql: `
						-- Direct entities from cache
						SELECT entity_id, schema_key, file_id, version_id, plugin_key, 
							   snapshot_content, schema_version, created_at, updated_at,
							   inherited_from_version_id
						FROM internal_state_cache
							WHERE inheritance_delete_marker = 0  -- Hide copy-on-write deletions						
						UNION ALL
						
						-- Inherited entities: child versions see parent entities they don't override
						SELECT isc.entity_id, isc.schema_key, isc.file_id, 
							   vi.version_id, -- Return child version_id
							   isc.plugin_key, isc.snapshot_content, isc.schema_version, 
							   isc.created_at, isc.updated_at,
							   vi.parent_version_id as inherited_from_version_id
						FROM (
							-- Get version inheritance relationships from cache
							SELECT 
								json_extract(isc_v.snapshot_content, '$.id') AS version_id,
								json_extract(isc_v.snapshot_content, '$.inherits_from_version_id') AS parent_version_id
							FROM internal_state_cache isc_v
							WHERE isc_v.schema_key = 'lix_version'
						) vi
						JOIN internal_state_cache isc ON isc.version_id = vi.parent_version_id
						WHERE vi.parent_version_id IS NOT NULL
						-- Only inherit entities that exist (not deleted) in parent
						AND isc.inheritance_delete_marker = 0
						-- Don't inherit if child already has this entity (including deletion markers)
						AND NOT EXISTS (
							SELECT 1 FROM internal_state_cache child_isc
							WHERE child_isc.version_id = vi.version_id
							  AND child_isc.entity_id = isc.entity_id
							  AND child_isc.schema_key = isc.schema_key
							  AND child_isc.file_id = isc.file_id
						)
					`,
					returnValue: "resultRows",
				});

				cursorState.results = cacheResults || [];
				cursorState.rowIndex = 0;

				// Cache miss - populate cache with actual recursive state query
				if (cursorState.results.length === 0) {
					if (canLog()) {
						createLixOwnLogSync({
							lix: { sqlite, db: db as any },
							key: "lix_state_cache_miss",
							level: "debug",
							message: `Cache miss detected - materializing state from CTE`,
						});
					}

					// Run the expensive recursive CTE to materialize state
					// Include deletions when populating cache so inheritance blocking works
					const stateResults = selectStateViaCTE(sqlite, {}, true);

					// Populate cache with materialized state results
					if (stateResults && stateResults.length > 0) {
						let cachePopulated = false;
						for (const row of stateResults) {
							// CTE returns rows as arrays, so access by index
							const entity_id = Array.isArray(row) ? row[0] : row.entity_id;
							const schema_key = Array.isArray(row) ? row[1] : row.schema_key;
							const file_id = Array.isArray(row) ? row[2] : row.file_id;
							const plugin_key = Array.isArray(row) ? row[3] : row.plugin_key;
							const snapshot_content = Array.isArray(row)
								? row[4]
								: row.snapshot_content;
							const schema_version = Array.isArray(row)
								? row[5]
								: row.schema_version;
							const version_id = Array.isArray(row) ? row[6] : row.version_id;
							const created_at = Array.isArray(row) ? row[7] : row.created_at;
							const updated_at = Array.isArray(row) ? row[8] : row.updated_at;
							const inherited_from_version_id = Array.isArray(row)
								? row[9]
								: row.inherited_from_version_id;

							// Skip rows with null entity_id (no actual state data found)
							if (!entity_id) {
								continue;
							}

							const isDeletion = snapshot_content === null;

							sqlite.exec({
								sql: `INSERT OR REPLACE INTO internal_state_cache 
									  (entity_id, schema_key, file_id, version_id, plugin_key, snapshot_content, schema_version, created_at, updated_at, inherited_from_version_id, inheritance_delete_marker)
									  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
								bind: [
									entity_id,
									schema_key,
									file_id,
									version_id,
									plugin_key,
									isDeletion
										? null
										: typeof snapshot_content === "string"
											? snapshot_content
											: JSON.stringify(snapshot_content),
									schema_version,
									created_at,
									updated_at,
									inherited_from_version_id === null ||
									inherited_from_version_id === undefined
										? null
										: inherited_from_version_id,
									isDeletion ? 1 : 0,
								],
							});
							cachePopulated = true;
						}
						if (cachePopulated && canLog()) {
							createLixOwnLogSync({
								lix: { sqlite, db: db as any },
								key: "lix_state_cache_populated",
								level: "debug",
								message: `Cache populated with ${stateResults?.length || 0} rows from CTE`,
							});
						}
					}

					// Re-query cache after population

					// Re-query after population with inheritance logic
					const newResults = sqlite.exec({
						sql: `
							-- Direct entities from cache
							SELECT entity_id, schema_key, file_id, version_id, plugin_key, 
								   snapshot_content, schema_version, created_at, updated_at,
								   inherited_from_version_id
							FROM internal_state_cache
								WHERE inheritance_delete_marker = 0  -- Hide copy-on-write deletions						
							UNION ALL
							
							-- Inherited entities: child versions see parent entities they don't override
							SELECT isc.entity_id, isc.schema_key, isc.file_id, 
								   vi.version_id, -- Return child version_id
								   isc.plugin_key, isc.snapshot_content, isc.schema_version, 
								   isc.created_at, isc.updated_at,
								   vi.parent_version_id as inherited_from_version_id
							FROM (
								-- Get version inheritance relationships from cache
								SELECT 
									json_extract(isc_v.snapshot_content, '$.id') AS version_id,
									json_extract(isc_v.snapshot_content, '$.inherits_from_version_id') AS parent_version_id
								FROM internal_state_cache isc_v
								WHERE isc_v.schema_key = 'lix_version'
							) vi
							JOIN internal_state_cache isc ON isc.version_id = vi.parent_version_id
							WHERE vi.parent_version_id IS NOT NULL
							-- Only inherit entities that exist (not deleted) in parent
							AND isc.inheritance_delete_marker = 0
							-- Don't inherit if child already has this entity (including deletion markers)
							AND NOT EXISTS (
								SELECT 1 FROM internal_state_cache child_isc
								WHERE child_isc.version_id = vi.version_id
								  AND child_isc.entity_id = isc.entity_id
								  AND child_isc.schema_key = isc.schema_key
								  AND child_isc.file_id = isc.file_id
							)
						`,
						returnValue: "resultRows",
					});
					cursorState.results = newResults || [];
				} else {
					if (canLog()) {
						createLixOwnLogSync({
							lix: { sqlite, db: db as any },
							key: "lix_state_cache_hit",
							level: "debug",
							message: `Cache hit - returning ${cursorState.results.length} cached rows`,
						});
					}
				}

				return capi.SQLITE_OK;
			},

			xNext: (pCursor: any) => {
				const cursorState = cursorStates.get(pCursor);
				cursorState.rowIndex++;
				return capi.SQLITE_OK;
			},

			xEof: (pCursor: any) => {
				const cursorState = cursorStates.get(pCursor);
				return cursorState.rowIndex >= cursorState.results.length ? 1 : 0;
			},

			xColumn: (pCursor: any, pContext: any, iCol: number) => {
				const cursorState = cursorStates.get(pCursor);
				const row = cursorState.results[cursorState.rowIndex];

				if (!row) {
					capi.sqlite3_result_null(pContext);
					return capi.SQLITE_OK;
				}

				// Handle array-style results from SQLite exec
				let value;
				if (Array.isArray(row)) {
					value = row[iCol];
				} else {
					const columnName = getColumnName(iCol);
					value = row[columnName];
				}

				// Handle special cases for null values that might be stored as strings
				if (
					value === "null" &&
					getColumnName(iCol) === "inherited_from_version_id"
				) {
					capi.sqlite3_result_null(pContext);
					return capi.SQLITE_OK;
				}

				if (value === null || value === undefined) {
					capi.sqlite3_result_null(pContext);
				} else if (typeof value === "object") {
					capi.sqlite3_result_js(pContext, JSON.stringify(value));
				} else {
					capi.sqlite3_result_js(pContext, value);
				}

				return capi.SQLITE_OK;
			},

			xRowid: (pCursor: any, pRowid: any) => {
				const cursorState = cursorStates.get(pCursor);
				sqlite.sqlite3.vtab.xRowid(pRowid, cursorState.rowIndex);
				return capi.SQLITE_OK;
			},
		},
		false
	);

	capi.sqlite3_create_module(sqlite.pointer!, "state_vtab", module, 0);

	// Create the virtual table but don't activate it until after initialization
	sqlite.exec(
		`CREATE VIRTUAL TABLE IF NOT EXISTS state_vtab_impl USING state_vtab();`
	);

	// TODO replace state view with instead of triggers by implementing xUpdate
	// in the virtual table

	const sql = `
  CREATE TABLE IF NOT EXISTS internal_state_cache (
    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    file_id TEXT NOT NULL,
    version_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    snapshot_content TEXT, -- Allow NULL for deletions
    schema_version TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    inherited_from_version_id TEXT,
    inheritance_delete_marker INTEGER DEFAULT 0, -- Flag for copy-on-write deletion markers
    PRIMARY KEY (entity_id, schema_key, file_id, version_id)
  );

  -- Create state view that selects from the virtual table
  CREATE VIEW IF NOT EXISTS state AS SELECT * FROM state_vtab_impl;

  CREATE TRIGGER IF NOT EXISTS state_insert
  INSTEAD OF INSERT ON state
  BEGIN
    SELECT validate_snapshot_content(
      (SELECT stored_schema.value FROM stored_schema WHERE stored_schema.key = NEW.schema_key),
      NEW.snapshot_content,
      'insert',
      NEW.entity_id,
      NEW.version_id
    );

    SELECT handle_state_mutation(
      NEW.entity_id,
      NEW.schema_key,
      NEW.file_id,
      NEW.plugin_key,
      json(NEW.snapshot_content),
      NEW.version_id,
      NEW.schema_version
    );
    
  END;

  CREATE TRIGGER IF NOT EXISTS state_update
  INSTEAD OF UPDATE ON state
  BEGIN
    SELECT validate_snapshot_content(
      (SELECT stored_schema.value FROM stored_schema WHERE stored_schema.key = NEW.schema_key),
      NEW.snapshot_content,
      'update',
      NEW.entity_id,
      NEW.version_id
    );

    SELECT handle_state_mutation(
      NEW.entity_id,
      NEW.schema_key,
      NEW.file_id,
      NEW.plugin_key,
      json(NEW.snapshot_content),
      NEW.version_id,
      NEW.schema_version
    );
    
  END;

  CREATE TRIGGER IF NOT EXISTS state_delete
  INSTEAD OF DELETE ON state
  BEGIN
    SELECT validate_snapshot_content(
      (SELECT stored_schema.value FROM stored_schema WHERE stored_schema.key = OLD.schema_key),
      OLD.snapshot_content,
      'delete',
      OLD.entity_id,
      OLD.version_id
    );

    SELECT handle_state_mutation(
      OLD.entity_id,
      OLD.schema_key,
      OLD.file_id,
      OLD.plugin_key,
      null,
      OLD.version_id,
      OLD.schema_version
    );
    
  END;
`;

	return sqlite.exec(sql);
}

// Helper functions for the virtual table

function getColumnName(columnIndex: number): string {
	const columns = [
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
	];
	return columns[columnIndex] || "unknown";
}

function selectStateViaCTE(
	sqlite: SqliteWasmDatabase,
	filters: Record<string, string>,
	includeDeletions: boolean = false
): any[] {
	let sql = `
		WITH
			all_changes_with_snapshots AS (
				SELECT ic.id, ic.entity_id, ic.schema_key, ic.file_id, ic.plugin_key,
					   ic.schema_version, 
					   CASE 
					     WHEN ic.snapshot_id = 'no-content' THEN NULL
					     ELSE json(s.content)
					   END AS snapshot_content 
				FROM internal_change ic
				LEFT JOIN internal_snapshot s ON ic.snapshot_id = s.id
			),
			root_cs_of_all_versions AS (
				SELECT json_extract(v.snapshot_content, '$.change_set_id') AS version_change_set_id, 
					   v.entity_id AS version_id
				FROM all_changes_with_snapshots v
				WHERE v.schema_key = 'lix_version'
			),
			reachable_cs_from_roots(id, version_id) AS (
				SELECT version_change_set_id, version_id FROM root_cs_of_all_versions
				UNION
				SELECT json_extract(e.snapshot_content, '$.parent_id'), r.version_id
				FROM all_changes_with_snapshots e 
				JOIN reachable_cs_from_roots r ON json_extract(e.snapshot_content, '$.child_id') = r.id
				WHERE e.schema_key = 'lix_change_set_edge'
			),
			cse_in_reachable_cs AS (
				SELECT json_extract(ias.snapshot_content, '$.entity_id') AS target_entity_id,
					   json_extract(ias.snapshot_content, '$.file_id') AS target_file_id,
					   json_extract(ias.snapshot_content, '$.schema_key') AS target_schema_key, 
					   json_extract(ias.snapshot_content, '$.change_id') AS target_change_id,
					   json_extract(ias.snapshot_content, '$.change_set_id') AS cse_origin_change_set_id,
					   rcs.version_id
				FROM all_changes_with_snapshots ias
				JOIN reachable_cs_from_roots rcs ON json_extract(ias.snapshot_content, '$.change_set_id') = rcs.id
				WHERE ias.schema_key = 'lix_change_set_element'
			),
			leaf_target_snapshots AS (
				SELECT target_change.entity_id, target_change.schema_key, target_change.file_id,
					   target_change.plugin_key, target_change.snapshot_content AS snapshot_content,
					   target_change.schema_version, r.version_id
				FROM cse_in_reachable_cs r 
				INNER JOIN all_changes_with_snapshots target_change ON r.target_change_id = target_change.id
				WHERE NOT EXISTS (
					WITH RECURSIVE descendants_of_current_cs(id) AS ( 
						SELECT r.cse_origin_change_set_id 
						UNION
						SELECT json_extract(edge.snapshot_content, '$.child_id')
						FROM all_changes_with_snapshots edge
						JOIN descendants_of_current_cs d ON json_extract(edge.snapshot_content, '$.parent_id') = d.id
						WHERE edge.schema_key = 'lix_change_set_edge'
						  AND json_extract(edge.snapshot_content, '$.child_id') IN (
						  	SELECT id FROM reachable_cs_from_roots WHERE version_id = r.version_id
						  )
					)
					SELECT 1 FROM cse_in_reachable_cs newer_r 
					WHERE newer_r.target_entity_id = r.target_entity_id 
					  AND newer_r.target_file_id = r.target_file_id       
					  AND newer_r.target_schema_key = r.target_schema_key 
					  AND newer_r.version_id = r.version_id
					  AND (newer_r.cse_origin_change_set_id != r.cse_origin_change_set_id OR newer_r.target_change_id != r.target_change_id) 
					  AND newer_r.cse_origin_change_set_id IN descendants_of_current_cs
				)
			),
			-- Get version inheritance relationships
			version_inheritance AS (
				SELECT DISTINCT
					v.entity_id AS version_id,
					json_extract(v.snapshot_content, '$.inherits_from_version_id') AS parent_version_id
				FROM all_changes_with_snapshots v
				WHERE v.schema_key = 'lix_version'
			),
			-- Combine direct entities with inherited entities
			all_entities AS (
				-- Direct entities from leaf_target_snapshots
				SELECT 
					entity_id, schema_key, file_id, plugin_key, snapshot_content, schema_version,
					version_id, version_id as visible_in_version, NULL as inherited_from_version_id
				FROM leaf_target_snapshots
				
				UNION ALL
				
				-- Inherited entities from parent versions
				SELECT 
					ls.entity_id, ls.schema_key, ls.file_id, ls.plugin_key, ls.snapshot_content, ls.schema_version,
					vi.version_id, -- Use child version_id for testing
					vi.version_id as visible_in_version, -- Make visible in child version
					vi.parent_version_id as inherited_from_version_id
				FROM version_inheritance vi
				JOIN leaf_target_snapshots ls ON ls.version_id = vi.parent_version_id
				WHERE vi.parent_version_id IS NOT NULL
				AND ls.snapshot_content IS NOT NULL -- Don't inherit deleted entities
				-- Don't inherit if child already has this entity (including deletion markers)
				-- Use a more comprehensive check that includes both leaf snapshots and direct inheritance blocking
				AND NOT EXISTS (
					-- Check if there's ANY change for this entity in the child version
					-- This includes creation, update, AND deletion changes
					SELECT 1 FROM leaf_target_snapshots child_ls
					WHERE child_ls.version_id = vi.version_id
					  AND child_ls.entity_id = ls.entity_id
					  AND child_ls.schema_key = ls.schema_key
					  AND child_ls.file_id = ls.file_id
				)
				-- Additional safeguard: check that no change set element exists for this entity in child
				AND NOT EXISTS (
					SELECT 1 FROM cse_in_reachable_cs cse
					JOIN all_changes_with_snapshots target_change ON cse.target_change_id = target_change.id
					WHERE cse.version_id = vi.version_id
					  AND target_change.entity_id = ls.entity_id
					  AND target_change.schema_key = ls.schema_key
					  AND target_change.file_id = ls.file_id
				)
			),
		-- Prioritize direct entities over inherited ones, then deduplicate
		prioritized_entities AS (
			SELECT *,
				   -- Priority: direct entities (inherited_from_version_id IS NULL) over inherited
				   CASE WHEN inherited_from_version_id IS NULL THEN 1 ELSE 2 END as priority,
				   -- Row number for deduplication within same priority
				   ROW_NUMBER() OVER (
					   PARTITION BY entity_id, schema_key, file_id, visible_in_version 
					   ORDER BY CASE WHEN inherited_from_version_id IS NULL THEN 1 ELSE 2 END,
					            -- Among inherited entities, prefer those with earlier timestamps
					            version_id
				   ) as rn
			FROM all_entities ae
			-- Don't filter out entities with null snapshot_content here
			-- We need deletion markers to be included for proper inheritance blocking
		)
		SELECT DISTINCT
			pe.entity_id,
			pe.schema_key,
			pe.file_id,
			pe.plugin_key,
			pe.snapshot_content,
			pe.schema_version,
			pe.version_id,
			(SELECT MIN(ic.created_at) FROM internal_change ic 
			 WHERE ic.entity_id = pe.entity_id AND ic.schema_key = pe.schema_key AND ic.file_id = pe.file_id) AS created_at,
			COALESCE(
				(SELECT MAX(ic.created_at) FROM internal_change ic 
				 WHERE ic.entity_id = pe.entity_id AND ic.schema_key = pe.schema_key AND ic.file_id = pe.file_id
				   AND ic.id IN (SELECT cse.target_change_id FROM cse_in_reachable_cs cse WHERE cse.version_id = pe.version_id)),
				(SELECT MIN(ic.created_at) FROM internal_change ic 
				 WHERE ic.entity_id = pe.entity_id AND ic.schema_key = pe.schema_key AND ic.file_id = pe.file_id)
			) AS updated_at,
			pe.inherited_from_version_id
		FROM prioritized_entities pe
		WHERE pe.rn = 1
		${includeDeletions ? "" : "-- Filter out deletion markers from final results\n		AND pe.snapshot_content IS NOT NULL"}
	`;

	const bindings: string[] = [];
	const conditions: string[] = [];

	Object.entries(filters).forEach(([key, value]) => {
		if (key === "version_id") {
			// For version_id filter, use visible_in_version
			conditions.push(`ae.visible_in_version = ?`);
		} else {
			conditions.push(`ae.${key} = ?`);
		}
		bindings.push(value);
	});

	if (conditions.length > 0) {
		sql += " AND " + conditions.join(" AND ");
	}

	const result = sqlite.exec({
		sql,
		bind: bindings,
		returnValue: "resultRows",
	});

	return result || [];
}

export type StateView = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	plugin_key: string;
	snapshot_content: Record<string, any>;
	schema_version: string;
	version_id: string;
	created_at: Generated<string>;
	updated_at: Generated<string>;
	inherited_from_version_id: string | null;
};

// Cache table type (internal table for state materialization)
export type InternalStateCacheTable = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	version_id: string;
	plugin_key: string;
	snapshot_content: string | null; // JSON string, NULL for deletions
	schema_version: string;
	created_at: string;
	updated_at: string;
	inherited_from_version_id: string | null;
	inheritance_delete_marker: number; // 1 for copy-on-write deletion markers, 0 otherwise
};

// Kysely operation types
export type StateRow = Selectable<StateView>;
export type NewStateRow = Insertable<StateView>;
export type StateRowUpdate = Updateable<StateView>;

export type StateCacheRow = Selectable<InternalStateCacheTable>;
export type NewStateCacheRow = Insertable<InternalStateCacheTable>;
export type StateCacheRowUpdate = Updateable<InternalStateCacheTable>;
