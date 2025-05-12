import type { Generated, Insertable, Selectable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchema } from "../schema/schema.js";

export function applyVersionDatabaseSchema(sqlite: SqliteWasmDatabase): void {
	sqlite.exec(`
  CREATE VIEW IF NOT EXISTS version AS
  SELECT
    json_extract(vj, '$.id') AS id,
    json_extract(vj, '$.name') AS name,
    json_extract(vj, '$.change_set_id') AS change_set_id
  FROM (
    SELECT handle_select_on_view('version', 'id', v.id) AS vj
    FROM (
      SELECT entity_id AS id
      FROM internal_change
      WHERE schema_key = 'lix_version'
        AND rowid IN (
          SELECT MAX(rowid)
          FROM internal_change
          WHERE schema_key = 'lix_version'
          GROUP BY entity_id
        )
        AND snapshot_id != 'no-content'
    ) v
  );

  CREATE TRIGGER version_insert
  INSTEAD OF INSERT ON version
  BEGIN
      SELECT handle_insert_on_view('version', 
        'id', COALESCE(NEW.id, uuid_v7()),
        'name', NEW.name,
        'change_set_id', NEW.change_set_id
      );
  END;

  CREATE TRIGGER version_update
  INSTEAD OF UPDATE ON version
  BEGIN
      SELECT handle_update_on_view('version', 
        'id', OLD.id,
        'name', NEW.name,
        'change_set_id', NEW.change_set_id
      );
  END;

  CREATE TRIGGER version_delete
  INSTEAD OF DELETE ON version
  BEGIN
      SELECT handle_delete_on_view('version', 
        'id', OLD.id
      );
  END;
`);
}

export const VersionSchema = {
	"x-lix-key": "lix_version",
	"x-lix-version": "1.0",
	"x-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
		change_set_id: { type: "string" },
	},
	required: ["id", "name", "change_set_id"],
} as const;
VersionSchema satisfies LixSchema;

export type Version = Selectable<VersionView>;
export type NewVersion = Insertable<VersionView>;
export type VersionView = {
	id: Generated<string>;
	name: string;
	change_set_id: string;
};
