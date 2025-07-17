import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { StateAllView } from "./schema.js";
import type { Kysely } from "kysely";
import type { LixInternalDatabaseSchema } from "../database/schema.js";

/**
 * Creates a view that provides direct access to underlying state tables
 * without going through the state virtual table. This avoids recursion
 * issues when operations like lix_timestamp() need to query state.
 *
 * IMPORTANT: This view assumes that the cache is fresh. It does not check
 * for cache staleness or trigger cache population. The caller is responsible
 * for ensuring the cache is up-to-date before querying this view.
 *
 * See https://github.com/opral/lix-sdk/issues/355
 */
export function applyUnderlyingStateView(args: {
	sqlite: SqliteWasmDatabase;
	db: Kysely<LixInternalDatabaseSchema>;
}): void {
	// Create the view that unions cache and untracked state
	args.sqlite.exec(`
		CREATE VIEW IF NOT EXISTS internal_underlying_state_all AS
		SELECT * FROM (
			-- 1. Untracked state (highest priority)
			SELECT 
				entity_id, 
				schema_key, 
				file_id, 
				plugin_key,
				snapshot_content, 
				schema_version, 
				version_id,
				created_at, 
				updated_at,
				NULL as inherited_from_version_id, 
				'untracked' as change_id, 
				1 as untracked,
				'untracked' as change_set_id
			FROM internal_state_all_untracked
			
			UNION ALL
			
			-- 2. Tracked state from cache (second priority) - only if no untracked exists
			SELECT 
				entity_id, 
				schema_key, 
				file_id, 
				plugin_key, 
				snapshot_content, 
				schema_version, 
				version_id,
				created_at, 
				updated_at,
				inherited_from_version_id, 
				change_id, 
				0 as untracked,
				change_set_id
			FROM internal_state_cache
			WHERE inheritance_delete_marker = 0  -- Hide copy-on-write deletions
			AND NOT EXISTS (
				SELECT 1 FROM internal_state_all_untracked unt
				WHERE unt.entity_id = internal_state_cache.entity_id
				  AND unt.schema_key = internal_state_cache.schema_key
				  AND unt.file_id = internal_state_cache.file_id
				  AND unt.version_id = internal_state_cache.version_id
			)
			
			UNION ALL
			
			-- 3. Inherited tracked state (lower priority) - only if no untracked or tracked exists
			SELECT 
				isc.entity_id, 
				isc.schema_key, 
				isc.file_id, 
				isc.plugin_key, 
				isc.snapshot_content, 
				isc.schema_version, 
				vi.version_id, -- Return child version_id
				isc.created_at, 
				isc.updated_at,
				vi.parent_version_id as inherited_from_version_id, 
				isc.change_id, 
				0 as untracked,
				isc.change_set_id
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
			-- Don't inherit if child has tracked state
			AND NOT EXISTS (
				SELECT 1 FROM internal_state_cache child_isc
				WHERE child_isc.version_id = vi.version_id
				  AND child_isc.entity_id = isc.entity_id
				  AND child_isc.schema_key = isc.schema_key
				  AND child_isc.file_id = isc.file_id
			)
			-- Don't inherit if child has untracked state
			AND NOT EXISTS (
				SELECT 1 FROM internal_state_all_untracked unt
				WHERE unt.version_id = vi.version_id
				  AND unt.entity_id = isc.entity_id
				  AND unt.schema_key = isc.schema_key
				  AND unt.file_id = isc.file_id
			)
			
			UNION ALL
			
			-- 4. Inherited untracked state (lowest priority) - only if no untracked or tracked exists
			SELECT 
				unt.entity_id, 
				unt.schema_key, 
				unt.file_id, 
				unt.plugin_key, 
				unt.snapshot_content, 
				unt.schema_version, 
				vi.version_id, -- Return child version_id
				unt.created_at, 
				unt.updated_at,
				vi.parent_version_id as inherited_from_version_id, 
				'untracked' as change_id, 
				1 as untracked,
				'untracked' as change_set_id
			FROM (
				-- Get version inheritance relationships from cache
				SELECT 
					json_extract(isc_v.snapshot_content, '$.id') AS version_id,
					json_extract(isc_v.snapshot_content, '$.inherits_from_version_id') AS parent_version_id
				FROM internal_state_cache isc_v
				WHERE isc_v.schema_key = 'lix_version'
			) vi
			JOIN internal_state_all_untracked unt ON unt.version_id = vi.parent_version_id
			WHERE vi.parent_version_id IS NOT NULL
			-- Don't inherit if child has tracked state
			AND NOT EXISTS (
				SELECT 1 FROM internal_state_cache child_isc
				WHERE child_isc.version_id = vi.version_id
				  AND child_isc.entity_id = unt.entity_id
				  AND child_isc.schema_key = unt.schema_key
				  AND child_isc.file_id = unt.file_id
			)
			-- Don't inherit if child has untracked state
			AND NOT EXISTS (
				SELECT 1 FROM internal_state_all_untracked child_unt
				WHERE child_unt.version_id = vi.version_id
				  AND child_unt.entity_id = unt.entity_id
				  AND child_unt.schema_key = unt.schema_key
				  AND child_unt.file_id = unt.file_id
			)
		);
	`);
}

// Type for the view - matches StateAllView
export type InternalUnderlyingStateAllView = Omit<
	StateAllView,
	"snapshot_content"
> & {
	// needs to manually stringify snapshot_content
	snapshot_content: string | null;
};

