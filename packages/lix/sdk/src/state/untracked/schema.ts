import type { LixEngine } from "../../engine/boot.js";

/**
 * Applies the schema for untracked state storage.
 *
 * Untracked state bypasses change control and is stored directly
 * without creating change records. This is used for temporary state,
 * configuration, and other data that doesn't need version history.
 */
export function applyUntrackedStateSchema(args: {
	engine: Pick<LixEngine, "sqlite">;
}): void {
	args.engine.sqlite.exec(`
		-- Table for untracked state that bypasses change control
		CREATE TABLE IF NOT EXISTS internal_state_all_untracked (
			entity_id TEXT NOT NULL,
			schema_key TEXT NOT NULL,
			file_id TEXT NOT NULL,
			version_id TEXT NOT NULL,
			plugin_key TEXT NOT NULL,
			snapshot_content BLOB, -- JSONB content, NULL for tombstones
			schema_version TEXT NOT NULL,
			created_at TEXT NOT NULL CHECK (created_at LIKE '%Z'),
			updated_at TEXT NOT NULL CHECK (updated_at LIKE '%Z'),
			inherited_from_version_id TEXT, -- Track inheritance source
			inheritance_delete_marker INTEGER DEFAULT 0 CHECK (inheritance_delete_marker IN (0, 1)), -- Flag for tombstones (1 = tombstone, 0 = normal)
			PRIMARY KEY (entity_id, schema_key, file_id, version_id),
			-- 8 = strictly JSONB
			-- https://www.sqlite.org/json1.html#jvalid
			CHECK (snapshot_content IS NULL OR json_valid(snapshot_content, 8)),
			-- Ensure content is either NULL or a JSON object (not string, array, etc)
			-- This prevents double-stringified JSON from being stored
			CHECK (snapshot_content IS NULL OR json_type(snapshot_content) = 'object'),
			-- Validation: if inheritance_delete_marker is 1, snapshot_content must be NULL
			CHECK (
				(inheritance_delete_marker = 1 AND snapshot_content IS NULL) OR
				(inheritance_delete_marker = 0)
			)
		) STRICT;

		-- Index for fast version_id filtering
		CREATE INDEX IF NOT EXISTS idx_internal_state_all_untracked_version_id 
			ON internal_state_all_untracked (version_id);

		CREATE INDEX IF NOT EXISTS ix_unt_v_f_s_e
			ON internal_state_all_untracked (version_id, file_id, schema_key, entity_id);
	`);
}

export type InternalStateAllUntrackedTable = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	version_id: string;
	plugin_key: string;
	snapshot_content: string | null; // JSON string, NULL for tombstones
	schema_version: string;
	created_at: string;
	updated_at: string;
	inherited_from_version_id: string | null;
	inheritance_delete_marker: number; // 1 for tombstones, 0 for normal entries
};
