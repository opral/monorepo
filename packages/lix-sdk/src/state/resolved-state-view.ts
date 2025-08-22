import type { StateAllView } from "./schema.js";
import { encodeStatePkPart } from "./primary-key.js";
import type { Lix } from "../index.js";

/**
 * Creates a view that provides direct access to resolved state data
 * without going through the state virtual table. This avoids recursion
 * issues when operations like lix_timestamp() need to query state.
 *
 * The "resolved state" combines:
 * - Transaction state (highest priority - pending changes)
 * - Untracked state (second priority)
 * - Tracked state from cache (third priority)
 * - Inherited state (resolved from parent versions)
 *
 * IMPORTANT: This view assumes that the cache is fresh. It does not check
 * for cache staleness or trigger cache population. The caller is responsible
 * for ensuring the cache is up-to-date before querying this view.
 *
 * See https://github.com/opral/lix-sdk/issues/355
 */
export function applyResolvedStateView(
	lix: Pick<Lix, "sqlite" | "db" | "hooks">
): void {
	// Register a custom SQLite function for encoding primary key parts
	lix.sqlite.createFunction({
		name: "lix_encode_pk_part",
		deterministic: true,
		arity: 1,
		xFunc: (_ctxPtr: number, ...args: any[]) => {
			const part = args[0];
			if (part === null || part === undefined) return "";
			return encodeStatePkPart(String(part));
		},
	});
	// Create the view that provides resolved state by combining transaction, cache and untracked state
	lix.sqlite.exec(`
    CREATE VIEW IF NOT EXISTS internal_resolved_state_all AS
      SELECT * FROM (
          -- 1. Transaction state (highest priority) - pending changes
          SELECT 
              'T' || '~' || lix_encode_pk_part(file_id) || '~' || lix_encode_pk_part(entity_id) || '~' || lix_encode_pk_part(version_id) as _pk,
              entity_id, 
              schema_key, 
              file_id, 
              plugin_key,
              json(snapshot_content) as snapshot_content, 
              schema_version, 
              version_id,
              created_at, 
              created_at as updated_at,
              NULL as inherited_from_version_id, 
              id as change_id, 
              untracked,
              'pending' as commit_id
          FROM internal_change_in_transaction
          -- Include both live rows and deletion tombstones (NULL snapshot_content)
			
			UNION ALL
			
          -- 2. Untracked state (second priority) - only if no transaction exists
          SELECT 
              'U' || '~' || lix_encode_pk_part(file_id) || '~' || lix_encode_pk_part(entity_id) || '~' || lix_encode_pk_part(version_id) as _pk,
              entity_id, 
              schema_key, 
              file_id, 
              plugin_key,
              json(snapshot_content) as snapshot_content, 
              schema_version, 
              version_id,
              created_at, 
              updated_at,
              NULL as inherited_from_version_id, 
              'untracked' as change_id, 
              1 as untracked,
              'untracked' as commit_id
          FROM internal_state_all_untracked
          WHERE (
            (inheritance_delete_marker = 0 AND snapshot_content IS NOT NULL)  -- live
            OR (inheritance_delete_marker = 1 AND snapshot_content IS NULL)   -- tombstone
          )
          AND NOT EXISTS (
              SELECT 1 FROM internal_change_in_transaction txn
              WHERE txn.entity_id = internal_state_all_untracked.entity_id
                AND txn.schema_key = internal_state_all_untracked.schema_key
                AND txn.file_id = internal_state_all_untracked.file_id
                AND txn.version_id = internal_state_all_untracked.version_id
          )
			
			UNION ALL
			
          -- 3. Tracked state from cache (third priority) - only if no transaction or untracked exists
          SELECT 
              'C' || '~' || lix_encode_pk_part(file_id) || '~' || lix_encode_pk_part(entity_id) || '~' || lix_encode_pk_part(version_id) as _pk,
              entity_id, 
              schema_key, 
              file_id, 
              plugin_key, 
              json(snapshot_content) as snapshot_content, 
              schema_version, 
              version_id,
              created_at, 
              updated_at,
              inherited_from_version_id, 
              change_id, 
              0 as untracked,
              commit_id
          FROM internal_state_cache
          WHERE (
            (inheritance_delete_marker = 0 AND snapshot_content IS NOT NULL)  -- live
            OR (inheritance_delete_marker = 1 AND snapshot_content IS NULL)   -- tombstone
          )
          AND NOT EXISTS (
              SELECT 1 FROM internal_change_in_transaction txn
              WHERE txn.entity_id = internal_state_cache.entity_id
                AND txn.schema_key = internal_state_cache.schema_key
                AND txn.file_id = internal_state_cache.file_id
                AND txn.version_id = internal_state_cache.version_id
          )
          AND NOT EXISTS (
              SELECT 1 FROM internal_state_all_untracked unt
              WHERE unt.entity_id = internal_state_cache.entity_id
                AND unt.schema_key = internal_state_cache.schema_key
                AND unt.file_id = internal_state_cache.file_id
                AND unt.version_id = internal_state_cache.version_id
          )
			
			UNION ALL
			
			-- 4. Inherited tracked state (fourth priority) - only if no transaction, untracked or tracked exists
			SELECT 
				'CI' || '~' || lix_encode_pk_part(isc.file_id) || '~' || lix_encode_pk_part(isc.entity_id) || '~' || lix_encode_pk_part(vi.version_id) as _pk,
				isc.entity_id, 
				isc.schema_key, 
				isc.file_id, 
				isc.plugin_key, 
				json(isc.snapshot_content) as snapshot_content, 
				isc.schema_version, 
				vi.version_id, -- Return child version_id
				isc.created_at, 
				isc.updated_at,
				isc.version_id as inherited_from_version_id, -- The actual version containing the entity
				isc.change_id, 
				0 as untracked,
				isc.commit_id
			FROM (
				-- Get all ancestor versions using recursive CTE for transitive inheritance
				WITH RECURSIVE version_inheritance AS (
					-- Base case: direct inheritance relationships
					SELECT 
						json_extract(v.snapshot_content, '$.id') AS version_id,
						json_extract(v.snapshot_content, '$.inherits_from_version_id') AS ancestor_version_id
					FROM internal_state_cache v
					WHERE v.schema_key = 'lix_version'
					  AND json_extract(v.snapshot_content, '$.inherits_from_version_id') IS NOT NULL
					
					UNION
					
					-- Recursive case: follow the inheritance chain
					SELECT 
						vi.version_id,
						json_extract(v.snapshot_content, '$.inherits_from_version_id') AS ancestor_version_id
					FROM version_inheritance vi
					JOIN internal_state_cache v ON v.schema_key = 'lix_version' 
					  AND json_extract(v.snapshot_content, '$.id') = vi.ancestor_version_id
					WHERE json_extract(v.snapshot_content, '$.inherits_from_version_id') IS NOT NULL
				)
				SELECT DISTINCT version_id, ancestor_version_id 
				FROM version_inheritance
			) vi
			JOIN internal_state_cache isc ON isc.version_id = vi.ancestor_version_id
          WHERE isc.inheritance_delete_marker = 0  -- Only inherit entities that exist (not deleted)
          AND isc.snapshot_content IS NOT NULL  -- Don't inherit tombstones
			-- Don't inherit if child has transaction state
			AND NOT EXISTS (
				SELECT 1 FROM internal_change_in_transaction txn
				WHERE txn.version_id = vi.version_id
				  AND txn.entity_id = isc.entity_id
				  AND txn.schema_key = isc.schema_key
				  AND txn.file_id = isc.file_id
			)
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
			
			-- 5. Inherited untracked state (lowest priority) - only if no transaction, untracked or tracked exists
			SELECT 
				'UI' || '~' || lix_encode_pk_part(unt.file_id) || '~' || lix_encode_pk_part(unt.entity_id) || '~' || lix_encode_pk_part(vi.version_id) as _pk,
				unt.entity_id, 
				unt.schema_key, 
				unt.file_id, 
				unt.plugin_key, 
				json(unt.snapshot_content) as snapshot_content, 
				unt.schema_version, 
				vi.version_id, -- Return child version_id
				unt.created_at, 
				unt.updated_at,
				unt.version_id as inherited_from_version_id, -- The actual version containing the entity
				'untracked' as change_id, 
				1 as untracked,
				'untracked' as commit_id
			FROM (
				-- Get all ancestor versions using recursive CTE for transitive inheritance
				WITH RECURSIVE version_inheritance AS (
					-- Base case: direct inheritance relationships
					SELECT 
						json_extract(v.snapshot_content, '$.id') AS version_id,
						json_extract(v.snapshot_content, '$.inherits_from_version_id') AS ancestor_version_id
					FROM internal_state_cache v
					WHERE v.schema_key = 'lix_version'
					  AND json_extract(v.snapshot_content, '$.inherits_from_version_id') IS NOT NULL
					
					UNION
					
					-- Recursive case: follow the inheritance chain
					SELECT 
						vi.version_id,
						json_extract(v.snapshot_content, '$.inherits_from_version_id') AS ancestor_version_id
					FROM version_inheritance vi
					JOIN internal_state_cache v ON v.schema_key = 'lix_version' 
					  AND json_extract(v.snapshot_content, '$.id') = vi.ancestor_version_id
					WHERE json_extract(v.snapshot_content, '$.inherits_from_version_id') IS NOT NULL
				)
				SELECT DISTINCT version_id, ancestor_version_id 
				FROM version_inheritance
			) vi
			JOIN internal_state_all_untracked unt ON unt.version_id = vi.ancestor_version_id
          WHERE unt.inheritance_delete_marker = 0  -- Only inherit entities that exist (not deleted)
          AND unt.snapshot_content IS NOT NULL  -- Don't inherit tombstones
			-- Don't inherit if child has transaction state
			AND NOT EXISTS (
				SELECT 1 FROM internal_change_in_transaction txn
				WHERE txn.version_id = vi.version_id
				  AND txn.entity_id = unt.entity_id
				  AND txn.schema_key = unt.schema_key
				  AND txn.file_id = unt.file_id
			)
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
			
			UNION ALL
			
			-- 6. Inherited transaction state (after inherited untracked) - only if no direct transaction exists
			SELECT 
				'TI' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(vi.version_id) as _pk,
				txn.entity_id, 
				txn.schema_key, 
				txn.file_id, 
				txn.plugin_key,
				json(txn.snapshot_content) as snapshot_content, 
				txn.schema_version, 
				vi.version_id, -- Return child version_id 
				txn.created_at, 
				txn.created_at as updated_at,
				vi.parent_version_id as inherited_from_version_id, 
				txn.id as change_id, 
				txn.untracked,
				'pending' as commit_id
			FROM (
				-- Get version inheritance relationships from cache
				SELECT DISTINCT
					json_extract(isc_v.snapshot_content, '$.id') AS version_id,
					json_extract(isc_v.snapshot_content, '$.inherits_from_version_id') AS parent_version_id
				FROM internal_state_cache isc_v
				WHERE isc_v.schema_key = 'lix_version'
			) vi
			JOIN internal_change_in_transaction txn ON txn.version_id = vi.parent_version_id
			WHERE vi.parent_version_id IS NOT NULL
			-- Only inherit entities that exist (not deleted) in parent transaction
			AND txn.snapshot_content IS NOT NULL
			-- Don't inherit if child has direct transaction state
			AND NOT EXISTS (
				SELECT 1 FROM internal_change_in_transaction child_txn
				WHERE child_txn.version_id = vi.version_id
				  AND child_txn.entity_id = txn.entity_id
				  AND child_txn.schema_key = txn.schema_key
				  AND child_txn.file_id = txn.file_id
			)
			-- Don't inherit if child has tracked state
			AND NOT EXISTS (
				SELECT 1 FROM internal_state_cache child_isc
				WHERE child_isc.version_id = vi.version_id
				  AND child_isc.entity_id = txn.entity_id
				  AND child_isc.schema_key = txn.schema_key
				  AND child_isc.file_id = txn.file_id
			)
			-- Don't inherit if child has untracked state
			AND NOT EXISTS (
				SELECT 1 FROM internal_state_all_untracked child_unt
				WHERE child_unt.version_id = vi.version_id
				  AND child_unt.entity_id = txn.entity_id
				  AND child_unt.schema_key = txn.schema_key
				  AND child_unt.file_id = txn.file_id
			)
		);
	`);
}

// Type for the view - matches StateAllView
export type InternalResolvedStateAllView = Omit<
	StateAllView,
	"snapshot_content"
> & {
	/**
	 * Primary key in format: tag~file_id~entity_id~version_id
	 * where tag is T (transaction), U (untracked), UI (untracked inherited), C (cached), CI (cached inherited), or TI (transaction inherited)
	 */
	_pk: string;
	// needs to manually stringify snapshot_content
	snapshot_content: string | null;
};
