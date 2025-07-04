import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Generated } from "kysely";

export function applySnapshotDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	return sqlite.exec(`
  CREATE TABLE IF NOT EXISTS internal_snapshot (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    content BLOB -- jsonb or binary file
  ) STRICT;

  INSERT OR IGNORE INTO internal_snapshot (id, content)
  VALUES ('no-content', NULL);
`);
}

export type InternalSnapshotTable = {
	id: Generated<string>;
	content: Record<string, any> | null;
};
