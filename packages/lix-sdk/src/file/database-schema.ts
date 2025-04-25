import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { validateFilePath } from "./validate-file-path.js";

/**
 * Applies the file table schema to the given sqlite database.
 */
export function applyFileDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	sqlite.createFunction({
		name: "is_valid_file_path",
		arity: 1,
		xFunc: (_ctx: number, value) => {
			return validateFilePath(value as string) as unknown as string;
		},
		deterministic: true,
	});

	sqlite.exec(`
  -- file
  CREATE TABLE IF NOT EXISTS file (
    id TEXT PRIMARY KEY DEFAULT (nano_id(10)),
    path TEXT NOT NULL UNIQUE,
    data BLOB NOT NULL,
    metadata BLOB,
    CHECK (is_valid_file_path(path))
  ) STRICT;
`);
	return sqlite;
}
