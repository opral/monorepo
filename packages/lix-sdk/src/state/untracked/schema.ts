import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

/**
 * Applies the schema for untracked state storage.
 *
 * Untracked state bypasses change control and is stored directly
 * without creating change records. This is used for temporary state,
 * configuration, and other data that doesn't need version history.
 */
export function applyUntrackedStateSchema(args: {
	sqlite: SqliteWasmDatabase;
}): void {
	args.sqlite.exec(`
		-- Table for untracked state that bypasses change control
		CREATE TABLE IF NOT EXISTS internal_state_all_untracked (
			entity_id TEXT NOT NULL,
			schema_key TEXT NOT NULL,
			file_id TEXT NOT NULL,
			version_id TEXT NOT NULL,
			plugin_key TEXT NOT NULL,
			snapshot_content TEXT NOT NULL, -- JSON content
			schema_version TEXT NOT NULL,
			created_at TEXT NOT NULL CHECK (created_at LIKE '%Z'),
			updated_at TEXT NOT NULL CHECK (updated_at LIKE '%Z'),
			PRIMARY KEY (entity_id, schema_key, file_id, version_id)
		) STRICT;
	`);
}

export type InternalStateAllUntrackedTable = {
	entity_id: string;
	schema_key: string;
	file_id: string;
	version_id: string;
	plugin_key: string;
	snapshot_content: string; // JSON string, not null for untracked
	schema_version: string;
	created_at: string;
	updated_at: string;
};
