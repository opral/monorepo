import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyFileSchema(sqlite: SqliteWasmDatabase): void {
	sqlite.exec(`
  CREATE VIEW IF NOT EXISTS file AS
	SELECT
		json_extract(vj, '$.id') AS id,
		json_extract(vj, '$.path') AS path,
		json_extract(vj, '$.version_id') AS version_id
	FROM (
		SELECT get_and_materialize_row('file', 'id', v.id) AS vj
		FROM (
			SELECT 
				c.entity_id AS id,
				json_extract(s.content, '$.version_id') AS version_id
			FROM change c
			INNER JOIN snapshot s ON c.snapshot_id = s.id
			WHERE c.schema_key = 'lix_file_table'
				AND c.rowid IN (
					SELECT MAX(c2.rowid)
					FROM change c2
					WHERE c2.schema_key = 'lix_file_table'
					GROUP BY c2.entity_id
				)
				AND c.snapshot_id != 'no-content'
		) v
	);


  CREATE TRIGGER file_insert
  INSTEAD OF INSERT ON file
  BEGIN
      INSERT INTO snapshot (content)
      VALUES (json_object('path', NEW.path, 'version_id', NEW.version_id, 'id', COALESCE(NEW.id, uuid_v7())));

      INSERT INTO change (entity_id, schema_key, snapshot_id, file_id, plugin_key)
      VALUES (
          (SELECT json_extract(content, '$.id') FROM snapshot ORDER BY rowid DESC LIMIT 1),
          'lix_file_table',
          (SELECT id FROM snapshot ORDER BY rowid DESC LIMIT 1),
          'lix_own_change_control',
          'lix_own_change_control'
      );
  END;

  CREATE TRIGGER file_update
  INSTEAD OF UPDATE ON file
  BEGIN
      INSERT INTO snapshot (content)
      VALUES (json_object('path', NEW.path, 'version_id', NEW.version_id, 'id', COALESCE(NEW.id, OLD.id)));

      INSERT INTO change (entity_id, schema_key, snapshot_id, file_id, plugin_key)
      VALUES (
          OLD.id, 
          'lix_file_table',
          (SELECT id FROM snapshot ORDER BY rowid DESC LIMIT 1),
          'lix_own_change_control',
          'lix_own_change_control'
      );
  END;

  CREATE TRIGGER file_delete
  INSTEAD OF DELETE ON file
  BEGIN
      INSERT INTO change (entity_id, schema_key, snapshot_id, file_id, plugin_key)
      VALUES (
          OLD.id,
          'lix_file_table',
          'no-content',
          'lix_own_change_control',
          'lix_own_change_control'
      );
  END;

  CREATE TABLE IF NOT EXISTS file_materialized (
    id TEXT NOT NULL,
    path TEXT NOT NULL,
    data TEXT NOT NULL,
		change_set_id TEXT NOT NULL
  ) STRICT;
`);
}

export const FileViewJsonSchema = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	properties: {
		id: { type: "string" },
		path: { type: "string" },
		version_id: { type: "string" },
		metadata: { type: ["object", "null"] },
	},
	required: ["id", "path", "version_id"],
} as const;

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
	// data: Uint8Array;
	version_id: string;
	metadata: Record<string, any> | null;
};

export type FileMaterialized = Selectable<FileMaterializedTable>;
export type NewFileMaterialized = Insertable<FileMaterializedTable>;
export type FileMaterializedTable = {
	id: Generated<string>;
	path: string;
	// data: Uint8Array;
	change_set_id: string;
	metadata: Record<string, any> | null;
};
