import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { EntitySchema } from "../entity-schema/schema.js";

export function applyChangeSetDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE VIEW IF NOT EXISTS change_set AS
	SELECT
		json_extract(vj, '$.id') AS id,
    json_extract(vj, '$.metadata') AS metadata
	FROM (
		SELECT get_and_cache_row('change_set', 'id', v.id) AS vj
		FROM (
			SELECT 
        entity_id AS id
			FROM internal_change
			WHERE schema_key = 'lix_change_set'
				AND rowid IN (
					SELECT MAX(rowid)
					FROM internal_change
					WHERE schema_key = 'lix_change_set'
					GROUP BY entity_id
				)
				AND snapshot_id != 'no-content'
		) v
	);

  CREATE TRIGGER change_set_insert
  INSTEAD OF INSERT ON change_set
  BEGIN
    SELECT handle_insert_on_view('change_set', 
      'id', COALESCE(NEW.id, nano_id()), 
      'metadata', NEW.metadata
    );
  END;

  CREATE TRIGGER change_set_update
  INSTEAD OF UPDATE ON change_set
  BEGIN
      SELECT handle_update_on_view('change_set', 
        'id', OLD.id,
        'metadata', NEW.metadata
      );
  END;

  CREATE TRIGGER change_set_delete
  INSTEAD OF DELETE ON change_set
  BEGIN
      SELECT handle_delete_on_view('change_set', 
        'id', OLD.id
      );
  END;
`;

	return sqlite.exec(sql);
}

export const ChangeSetSchema: EntitySchema = {
	"x-key": "lix_change_set",
	"x-version": "1.0",
	type: "object",
	properties: {
		id: { type: "string" },
		metadata: { type: "object" },
	},
	required: ["id"],
	additionalProperties: false,
};
export type ChangeSet = Selectable<ChangeSetView>;
export type NewChangeSet = Insertable<ChangeSetView>;
export type ChangeSetUpdate = Updateable<ChangeSetView>;
export type ChangeSetView = {
	id: Generated<string>;
	metadata: Record<string, any> | null;
};

// export type ChangeSetElement = Selectable<ChangeSetElementTable>;
// export type NewChangeSetElement = Insertable<ChangeSetElementTable>;
// export type ChangeSetElementUpdate = Updateable<ChangeSetElementTable>;
// export type ChangeSetElementTable = {
// 	change_set_id: string;
// 	change_id: string;
// 	entity_id: string;
// 	schema_key: string;
// 	file_id: string;
// };

// export type ChangeSetLabel = Selectable<ChangeSetLabelTable>;
// export type NewChangeSetLabel = Insertable<ChangeSetLabelTable>;
// export type ChangeSetLabelUpdate = Updateable<ChangeSetLabelTable>;
// export type ChangeSetLabelTable = {
// 	label_id: string;
// 	change_set_id: string;
// };

// export type ChangeSetThread = Selectable<ChangeSetThreadTable>;
// export type NewChangeSetThread = Insertable<ChangeSetThreadTable>;
// export type ChangeSetThreadUpdate = Updateable<ChangeSetThreadTable>;
// export type ChangeSetThreadTable = {
// 	change_set_id: string;
// 	thread_id: string;
// };
