import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchema } from "../schema/schema.js";

export function applyChangeSetDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE VIEW IF NOT EXISTS change_set AS
	SELECT
		json_extract(vj, '$.id') AS id,
    json_extract(vj, '$.metadata') AS metadata
	FROM (
		SELECT handle_select_on_view('change_set', 'id', v.id) AS vj
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

  -- change set element

  CREATE VIEW IF NOT EXISTS change_set_element AS
	SELECT
		json_extract(vj, '$.change_set_id') AS change_set_id,
    json_extract(vj, '$.change_id') AS change_id,
    json_extract(vj, '$.entity_id') AS entity_id,
    json_extract(vj, '$.schema_key') AS schema_key,
    json_extract(vj, '$.file_id') AS file_id
	FROM (
		SELECT handle_select_on_view('change_set_element', 'change_set_id', v.change_set_id, 'change_id', v.change_id) AS vj
		FROM (
			SELECT 
				substr(entity_id, 1, instr(entity_id, ',') - 1) AS change_set_id,
				substr(entity_id, instr(entity_id, ',') + 1) AS change_id				  
      FROM internal_change
			WHERE schema_key = 'lix_change_set_element'
				AND rowid IN (
					SELECT MAX(rowid)
					FROM internal_change
					WHERE schema_key = 'lix_change_set_element'
					GROUP BY entity_id
				)
				AND snapshot_id != 'no-content'
		) v
	);

  CREATE TRIGGER change_set_element_insert
  INSTEAD OF INSERT ON change_set_element
  BEGIN
    SELECT handle_insert_on_view('change_set_element', 
      'change_set_id', NEW.change_set_id, 
      'change_id', NEW.change_id,
      'entity_id', NEW.entity_id,
      'schema_key', NEW.schema_key,
      'file_id', NEW.file_id
    );
  END;

  CREATE TRIGGER change_set_element_update
  INSTEAD OF UPDATE ON change_set_element
  BEGIN
      SELECT handle_update_on_view('change_set_element', 
        'change_set_id', OLD.change_set_id,
        'change_id', NEW.change_id,
        'entity_id', NEW.entity_id,
        'schema_key', NEW.schema_key,
        'file_id', NEW.file_id
      );
  END;

  CREATE TRIGGER change_set_element_delete
  INSTEAD OF DELETE ON change_set_element
  BEGIN
      SELECT handle_delete_on_view('change_set_element', 
        'change_set_id', OLD.change_set_id,
        'change_id', OLD.change_id,
        'entity_id', OLD.entity_id,
        'schema_key', OLD.schema_key,
        'file_id', OLD.file_id
      );
  END;

  -- change set edge

  CREATE VIEW IF NOT EXISTS change_set_edge AS
  SELECT
    json_extract(vj, '$.parent_id') AS parent_id,
    json_extract(vj, '$.child_id') AS child_id
  FROM (
    SELECT handle_select_on_view('change_set_edge', 'parent_id', v.parent_id, 'child_id', v.child_id) AS vj
    FROM (
      SELECT 
        substr(entity_id, 1, instr(entity_id, ',') - 1) AS parent_id,
        substr(entity_id, instr(entity_id, ',') + 1) AS child_id				
      FROM internal_change
      WHERE schema_key = 'lix_change_set_edge'
        AND rowid IN (
          SELECT MAX(rowid)
          FROM internal_change
          WHERE schema_key = 'lix_change_set_edge'
          GROUP BY entity_id
        )
        AND snapshot_id != 'no-content'
    ) v
  );

  CREATE TRIGGER change_set_edge_insert
  INSTEAD OF INSERT ON change_set_edge
  BEGIN
    SELECT handle_insert_on_view('change_set_edge', 
      'parent_id', NEW.parent_id, 
      'child_id', NEW.child_id
    );
  END;

  CREATE TRIGGER change_set_edge_update
  INSTEAD OF UPDATE ON change_set_edge
  BEGIN
      SELECT handle_update_on_view('change_set_edge', 
        'parent_id', OLD.parent_id,
        'child_id', NEW.child_id
      );
  END;

  CREATE TRIGGER change_set_edge_delete
  INSTEAD OF DELETE ON change_set_edge
  BEGIN
      SELECT handle_delete_on_view('change_set_edge', 
        'parent_id', OLD.parent_id,
        'child_id', OLD.child_id
      );
  END;
`;

	return sqlite.exec(sql);
}

export const ChangeSetSchema: LixSchema = {
	"x-lix-key": "lix_change_set",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
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

export const ChangeSetElementSchema: LixSchema = {
	"x-lix-key": "lix_change_set_element",
	"x-lix-version": "1.0",
	// TODO foreign key constraint
	// "x-foreign-keys": {
	//   "change_set_id": "lix_change_set.id",
	//   "change_id": "lix_change.id",
	//   "schema_key": "lix_schema.key",
	//   "file_id": "lix_file.id",
	// }
	"x-lix-primary-key": ["change_set_id", "change_id"],
	"x-lix-unique": [["entity_id", "schema_key", "file_id"]],
	type: "object",
	properties: {
		change_set_id: { type: "string" },
		change_id: { type: "string" },
		entity_id: { type: "string" },
		schema_key: { type: "string" },
		file_id: { type: "string" },
	},
	required: [
		"change_set_id",
		"change_id",
		"entity_id",
		"schema_key",
		"file_id",
	],
	additionalProperties: false,
};

export type ChangeSetElement = Selectable<ChangeSetElementView>;
export type NewChangeSetElement = Insertable<ChangeSetElementView>;
export type ChangeSetElementUpdate = Updateable<ChangeSetElementView>;
export type ChangeSetElementView = {
	change_set_id: string;
	change_id: string;
	entity_id: string;
	schema_key: string;
	file_id: string;
};

export const ChangeSetEdgeSchema: LixSchema = {
	"x-lix-key": "lix_change_set_edge",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["parent_id", "child_id"],
	type: "object",
	properties: {
		parent_id: { type: "string" },
		child_id: { type: "string" },
	},
	required: ["parent_id", "child_id"],
	additionalProperties: false,
};

export type ChangeSetEdge = Selectable<ChangeSetEdgeView>;
export type NewChangeSetEdge = Insertable<ChangeSetEdgeView>;
export type ChangeSetEdgeUpdate = Updateable<ChangeSetEdgeView>;
export type ChangeSetEdgeView = {
	parent_id: string;
	child_id: string;
};


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
