import type { Generated, Insertable, Selectable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyVersionSchema(sqlite: SqliteWasmDatabase): void {
	sqlite.exec(`
  CREATE TABLE IF NOT EXISTS version_materialized (
		id TEXT NOT NULL,
    name TEXT,
    change_set_id TEXT NOT NULL
  ) STRICT;

	CREATE VIEW IF NOT EXISTS version AS
	SELECT
		json_extract(vj, '$.id') AS id,
		json_extract(vj, '$.name') AS name,
		json_extract(vj, '$.change_set_id') AS change_set_id
	FROM (
		SELECT get_and_materialize_row('version', 'id', v.id) AS vj
		FROM (
			SELECT entity_id AS id
			FROM change
			WHERE schema_key = 'lix_version_table'
				AND rowid IN (
					SELECT MAX(rowid)
					FROM change
					WHERE schema_key = 'lix_version_table'
					GROUP BY entity_id
				)
				AND snapshot_id != 'no-content'
		) v
	);

  CREATE TRIGGER version_insert
  INSTEAD OF INSERT ON version
  BEGIN
      INSERT INTO snapshot (content)
      VALUES (json_object('name', NEW.name, 'change_set_id', NEW.change_set_id, 'id', COALESCE(NEW.id, uuid_v7())));

      INSERT INTO change (entity_id, schema_key, snapshot_id, file_id, plugin_key)
      VALUES (
          (SELECT json_extract(content, '$.id') FROM snapshot ORDER BY rowid DESC LIMIT 1),
          'lix_version_table',
          (SELECT id FROM snapshot ORDER BY rowid DESC LIMIT 1),
          'lix_own_change_control',
          'lix_own_change_control'
      );
  END;

  CREATE TRIGGER version_update
  INSTEAD OF UPDATE ON version
  BEGIN
      INSERT INTO snapshot (content)
      VALUES (json_object('name', NEW.name, 'change_set_id', NEW.change_set_id, 'id', COALESCE(NEW.id, uuid_v7())));

      INSERT INTO change (entity_id, schema_key, snapshot_id, file_id, plugin_key)
      VALUES (
          OLD.id, 
          'lix_version_table',
          (SELECT id FROM snapshot ORDER BY rowid DESC LIMIT 1),
          'lix_own_change_control',
          'lix_own_change_control'
      );
  END;

  CREATE TRIGGER version_delete
  INSTEAD OF DELETE ON version
  BEGIN
      INSERT INTO change (entity_id, schema_key, snapshot_id, file_id, plugin_key)
      VALUES (
          OLD.id, 
          'lix_version_table',
          'no-content',
          'lix_own_change_control',
          'lix_own_change_control'
      );
  END;
`);
}

export const VersionViewJsonSchema = {
	$schema: "http://json-schema.org/draft-07/schema#",
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
		change_set_id: { type: "string" },
	},
	required: ["id", "name", "change_set_id"],
} as const;

export type Version = Selectable<VersionView>;
export type NewVersion = Insertable<VersionView>;
export type VersionView = {
	id: Generated<string>;
	name: string;
	change_set_id: string;
};

export type VersionMaterialized = Selectable<VersionMaterializedTable>;
export type NewVersionMaterialized = Insertable<VersionMaterializedTable>;
export type VersionMaterializedTable = {
	id: Generated<string>;
	name: string;
	change_set_id: string;
};
