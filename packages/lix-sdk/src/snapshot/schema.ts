import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Generated } from "kysely";

export function applySnapshotDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	return sqlite.exec(`
  CREATE TABLE IF NOT EXISTS internal_snapshot (
    id TEXT PRIMARY KEY DEFAULT (lix_uuid_v7()),
    content BLOB -- jsonb,

    -- 8 = strictly JSONB
    -- https://www.sqlite.org/json1.html#jvalid
    CHECK (json_valid(content, 8)),
    
    -- Ensure content is either NULL or a JSON object (not string, array, etc)
    -- This prevents double-stringified JSON from being stored
    CHECK (content IS NULL OR json_type(content) = 'object')
  ) STRICT;

  INSERT OR IGNORE INTO internal_snapshot (id, content)
  VALUES ('no-content', NULL);
`);
}

export type InternalSnapshotTable = {
	id: Generated<string>;
	content: Record<string, any> | null;
};
