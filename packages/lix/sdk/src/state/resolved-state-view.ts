import type { StateAllView } from "./views/state-all.js";
import { encodeStatePkPart } from "./vtable/primary-key.js";
import type { LixEngine } from "../engine/boot.js";

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
export function applyResolvedStateView(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	const { engine } = args;
	// Register a custom SQLite function for encoding primary key parts
	engine.sqlite.createFunction({
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
	engine.sqlite.exec(`
    CREATE VIEW IF NOT EXISTS internal_resolved_state_all AS
      WITH RECURSIVE
        version_descriptor_base AS (
          SELECT
            json_extract(isc_v.snapshot_content, '$.id') AS version_id,
            json_extract(isc_v.snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id
          FROM internal_state_cache isc_v
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
      SELECT * FROM (
          -- 1. Transaction state (highest priority) - pending changes
          SELECT 
              'T' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(txn.version_id) AS _pk,
              txn.entity_id,
              txn.schema_key,
              txn.file_id,
              txn.plugin_key,
              json(txn.snapshot_content) AS snapshot_content,
              txn.schema_version,
              txn.version_id,
              txn.created_at,
              txn.created_at AS updated_at,
              NULL AS inherited_from_version_id,
              txn.id AS change_id,
              txn.untracked,
              'pending' AS commit_id,
              json(txn.metadata) AS metadata,
              ws_txn.writer_key
          FROM internal_transaction_state txn
          LEFT JOIN internal_state_writer ws_txn ON
            ws_txn.file_id = txn.file_id AND
            ws_txn.entity_id = txn.entity_id AND
            ws_txn.schema_key = txn.schema_key AND
            ws_txn.version_id = txn.version_id

		UNION ALL

          -- 2. Untracked state (second priority) - only if no transaction exists
          SELECT 
              'U' || '~' || lix_encode_pk_part(u.file_id) || '~' || lix_encode_pk_part(u.entity_id) || '~' || lix_encode_pk_part(u.version_id) AS _pk,
              u.entity_id,
              u.schema_key,
              u.file_id,
              u.plugin_key,
              json(u.snapshot_content) AS snapshot_content,
              u.schema_version,
              u.version_id,
              u.created_at,
              u.updated_at,
              NULL AS inherited_from_version_id,
              'untracked' AS change_id,
              1 AS untracked,
              'untracked' AS commit_id,
              NULL AS metadata,
              ws_untracked.writer_key
          FROM internal_state_all_untracked u
          LEFT JOIN internal_state_writer ws_untracked ON
            ws_untracked.file_id = u.file_id AND
            ws_untracked.entity_id = u.entity_id AND
            ws_untracked.schema_key = u.schema_key AND
            ws_untracked.version_id = u.version_id
          WHERE (
            (u.inheritance_delete_marker = 0 AND u.snapshot_content IS NOT NULL) OR
            (u.inheritance_delete_marker = 1 AND u.snapshot_content IS NULL)
          )
            AND NOT EXISTS (
              SELECT 1 FROM internal_transaction_state t
              WHERE t.version_id = u.version_id
                AND t.file_id = u.file_id
                AND t.schema_key = u.schema_key
                AND t.entity_id = u.entity_id
            )

		UNION ALL

          -- 3. Tracked state from cache (third priority) - only if no transaction or untracked exists
          SELECT 
              'C' || '~' || lix_encode_pk_part(c.file_id) || '~' || lix_encode_pk_part(c.entity_id) || '~' || lix_encode_pk_part(c.version_id) AS _pk,
              c.entity_id,
              c.schema_key,
              c.file_id,
              c.plugin_key,
              json(c.snapshot_content) AS snapshot_content,
              c.schema_version,
              c.version_id,
              c.created_at,
              c.updated_at,
              c.inherited_from_version_id,
              c.change_id,
              0 AS untracked,
              c.commit_id,
              ch.metadata AS metadata,
              ws_cache.writer_key
          FROM internal_state_cache c
          LEFT JOIN change ch ON ch.id = c.change_id
          LEFT JOIN internal_state_writer ws_cache ON
            ws_cache.file_id = c.file_id AND
            ws_cache.entity_id = c.entity_id AND
            ws_cache.schema_key = c.schema_key AND
            ws_cache.version_id = c.version_id
          WHERE (
            (c.inheritance_delete_marker = 0 AND c.snapshot_content IS NOT NULL) OR
            (c.inheritance_delete_marker = 1 AND c.snapshot_content IS NULL)
          )
            AND NOT EXISTS (
              SELECT 1 FROM internal_transaction_state t
              WHERE t.version_id = c.version_id
                AND t.file_id = c.file_id
                AND t.schema_key = c.schema_key
                AND t.entity_id = c.entity_id
            )
            AND NOT EXISTS (
              SELECT 1 FROM internal_state_all_untracked u
              WHERE u.version_id = c.version_id
                AND u.file_id = c.file_id
                AND u.schema_key = c.schema_key
                AND u.entity_id = c.entity_id
            )

		UNION ALL

		-- 4. Inherited tracked state (fourth priority)
		SELECT 
			'CI' || '~' || lix_encode_pk_part(isc.file_id) || '~' || lix_encode_pk_part(isc.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk,
			isc.entity_id,
			isc.schema_key,
			isc.file_id,
			isc.plugin_key,
              json(isc.snapshot_content) AS snapshot_content,
			isc.schema_version,
			vi.version_id,
			isc.created_at,
			isc.updated_at,
			isc.version_id AS inherited_from_version_id,
			isc.change_id,
			0 AS untracked,
			isc.commit_id,
              ch.metadata AS metadata,
			COALESCE(ws_child.writer_key, ws_parent.writer_key) AS writer_key
		FROM version_inheritance vi
		JOIN internal_state_cache isc ON isc.version_id = vi.ancestor_version_id
		LEFT JOIN change ch ON ch.id = isc.change_id
		LEFT JOIN internal_state_writer ws_child ON
		  ws_child.file_id = isc.file_id AND
		  ws_child.entity_id = isc.entity_id AND
		  ws_child.schema_key = isc.schema_key AND
		  ws_child.version_id = vi.version_id
		LEFT JOIN internal_state_writer ws_parent ON
		  ws_parent.file_id = isc.file_id AND
		  ws_parent.entity_id = isc.entity_id AND
		  ws_parent.schema_key = isc.schema_key AND
		  ws_parent.version_id = isc.version_id
          WHERE isc.inheritance_delete_marker = 0
            AND isc.snapshot_content IS NOT NULL
		AND NOT EXISTS (
			SELECT 1 FROM internal_transaction_state t
              WHERE t.version_id = vi.version_id
                AND t.file_id = isc.file_id
                AND t.schema_key = isc.schema_key
                AND t.entity_id = isc.entity_id
		)
		AND NOT EXISTS (
			SELECT 1 FROM internal_state_cache child_isc
			WHERE child_isc.version_id = vi.version_id
			  AND child_isc.file_id = isc.file_id
			  AND child_isc.schema_key = isc.schema_key
			  AND child_isc.entity_id = isc.entity_id
		)
		AND NOT EXISTS (
			SELECT 1 FROM internal_state_all_untracked child_unt
			WHERE child_unt.version_id = vi.version_id
			  AND child_unt.file_id = isc.file_id
			  AND child_unt.schema_key = isc.schema_key
			  AND child_unt.entity_id = isc.entity_id
		)

		UNION ALL

		-- 5. Inherited untracked state (lowest priority)
		SELECT 
			'UI' || '~' || lix_encode_pk_part(unt.file_id) || '~' || lix_encode_pk_part(unt.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk,
			unt.entity_id,
			unt.schema_key,
			unt.file_id,
			unt.plugin_key,
              json(unt.snapshot_content) AS snapshot_content,
			unt.schema_version,
			vi.version_id,
			unt.created_at,
			unt.updated_at,
			unt.version_id AS inherited_from_version_id,
			'untracked' AS change_id,
			1 AS untracked,
			'untracked' AS commit_id,
              NULL AS metadata,
			COALESCE(ws_child.writer_key, ws_parent.writer_key) AS writer_key
		FROM version_inheritance vi
		JOIN internal_state_all_untracked unt ON unt.version_id = vi.ancestor_version_id
		LEFT JOIN internal_state_writer ws_child ON
		  ws_child.file_id = unt.file_id AND
		  ws_child.entity_id = unt.entity_id AND
		  ws_child.schema_key = unt.schema_key AND
		  ws_child.version_id = vi.version_id
		LEFT JOIN internal_state_writer ws_parent ON
		  ws_parent.file_id = unt.file_id AND
		  ws_parent.entity_id = unt.entity_id AND
		  ws_parent.schema_key = unt.schema_key AND
		  ws_parent.version_id = unt.version_id
          WHERE unt.inheritance_delete_marker = 0
            AND unt.snapshot_content IS NOT NULL
		AND NOT EXISTS (
			SELECT 1 FROM internal_transaction_state t
			WHERE t.version_id = vi.version_id
			  AND t.file_id = unt.file_id
			  AND t.schema_key = unt.schema_key
			  AND t.entity_id = unt.entity_id
		)
		AND NOT EXISTS (
			SELECT 1 FROM internal_state_cache child_isc
			WHERE child_isc.version_id = vi.version_id
			  AND child_isc.file_id = unt.file_id
			  AND child_isc.schema_key = unt.schema_key
			  AND child_isc.entity_id = unt.entity_id
		)
		AND NOT EXISTS (
			SELECT 1 FROM internal_state_all_untracked child_unt
			WHERE child_unt.version_id = vi.version_id
			  AND child_unt.file_id = unt.file_id
			  AND child_unt.schema_key = unt.schema_key
			  AND child_unt.entity_id = unt.entity_id
		)

		UNION ALL

		-- 6. Inherited transaction state
		SELECT 
			'TI' || '~' || lix_encode_pk_part(txn.file_id) || '~' || lix_encode_pk_part(txn.entity_id) || '~' || lix_encode_pk_part(vi.version_id) AS _pk,
			txn.entity_id,
			txn.schema_key,
			txn.file_id,
			txn.plugin_key,
              json(txn.snapshot_content) AS snapshot_content,
			txn.schema_version,
			vi.version_id,
			txn.created_at,
			txn.created_at AS updated_at,
			vi.parent_version_id AS inherited_from_version_id,
			txn.id AS change_id,
			txn.untracked,
			'pending' AS commit_id,
              json(txn.metadata) AS metadata,
			COALESCE(ws_child.writer_key, ws_parent.writer_key) AS writer_key
		FROM version_parent vi
		JOIN internal_transaction_state txn ON txn.version_id = vi.parent_version_id
		LEFT JOIN internal_state_writer ws_child ON
		  ws_child.file_id = txn.file_id AND
		  ws_child.entity_id = txn.entity_id AND
		  ws_child.schema_key = txn.schema_key AND
		  ws_child.version_id = vi.version_id
		LEFT JOIN internal_state_writer ws_parent ON
		  ws_parent.file_id = txn.file_id AND
		  ws_parent.entity_id = txn.entity_id AND
		  ws_parent.schema_key = txn.schema_key AND
		  ws_parent.version_id = vi.parent_version_id
		WHERE vi.parent_version_id IS NOT NULL
		  AND txn.snapshot_content IS NOT NULL
		  AND NOT EXISTS (
			SELECT 1 FROM internal_transaction_state child_txn
			WHERE child_txn.version_id = vi.version_id
			  AND child_txn.file_id = txn.file_id
			  AND child_txn.schema_key = txn.schema_key
			  AND child_txn.entity_id = txn.entity_id
		  )
		  AND NOT EXISTS (
			SELECT 1 FROM internal_state_cache child_isc
			WHERE child_isc.version_id = vi.version_id
			  AND child_isc.file_id = txn.file_id
			  AND child_isc.schema_key = txn.schema_key
			  AND child_isc.entity_id = txn.entity_id
		  )
		  AND NOT EXISTS (
			SELECT 1 FROM internal_state_all_untracked child_unt
			WHERE child_unt.version_id = vi.version_id
			  AND child_unt.file_id = txn.file_id
			  AND child_unt.schema_key = txn.schema_key
			  AND child_unt.entity_id = txn.entity_id
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
