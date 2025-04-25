import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { validateFilePath } from "./validate-file-path.js";
import type { Generated, Insertable, Selectable, Updateable } from "kysely";

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

// named lix file to avoid conflict with built-in file type
export type LixFile = Selectable<LixFileTable>;
export type NewLixFile = Insertable<LixFileTable>;
export type LixFileUpdate = Updateable<LixFileTable>;
export type LixFileTable = {
	id: Generated<string>;
	/**
	 * The path of the file.
	 *
	 * The path is currently defined as a subset of RFC 3986.
	 * Any path can be tested with the `isValidFilePath()` function.
	 *
	 * @example
	 *   - `/path/to/file.txt`
	 */
	path: string;
	data: Uint8Array;
	metadata: Record<string, any> | null;
};