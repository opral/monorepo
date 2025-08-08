import type { Selectable } from "kysely";
import type { Lix } from "../../lix/open-lix.js";

export function applyStateCacheSchema(lix: Pick<Lix, "sqlite">): void {
	lix.sqlite.exec(`
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
    change_id TEXT,
    commit_id TEXT, -- Allow NULL until commit is created
    PRIMARY KEY (entity_id, schema_key, file_id, version_id)
  ) strict;

  -- Index for fast version_id filtering
  CREATE INDEX IF NOT EXISTS idx_internal_state_cache_version_id 
    ON internal_state_cache (version_id);
`);
}

export type InternalStateCacheRow = Selectable<InternalStateCacheTable>;

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
	change_id: string;
	commit_id: string | null;
};
