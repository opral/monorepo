import type { Selectable, Generated, Insertable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { jsonSha256 } from "./json-sha-256.js";

export function applySnapshotDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	sqlite.createFunction({
		name: "json_sha256",
		arity: 1,
		xFunc: (_ctx: number, value) => {
			if (!value) {
				return "no-content";
			}

			const json = sqlite.exec("SELECT json(?)", {
				bind: [value],
				returnValue: "resultRows",
			})[0]![0];

			const parsed = JSON.parse(json as string);

			return jsonSha256(parsed);
		},
		deterministic: true,
	});

	sqlite.exec(`
  CREATE TABLE IF NOT EXISTS snapshot (
    id TEXT GENERATED ALWAYS AS (json_sha256(content)) STORED UNIQUE,
    content BLOB
  ) STRICT;

  -- Create the default 'no-content' snapshot
  -- to avoid foreign key constraint violations in tests
  INSERT OR IGNORE INTO snapshot (content) VALUES (NULL);

  CREATE INDEX IF NOT EXISTS idx_content_hash ON snapshot (id);
`);
	return sqlite;
}

export type Snapshot = Selectable<SnapshotTable>;
export type NewSnapshot = Insertable<SnapshotTable>;
export type SnapshotTable = {
	id: Generated<string>;
	/**
	 * The value of the change.
	 *
	 * Lix interprets an undefined value as delete operation.
	 *
	 * @example
	 *   - For a csv cell change, the value would be the new cell value.
	 *   - For an inlang message change, the value would be the new message.
	 */
	content: Record<string, any> | null;
};
