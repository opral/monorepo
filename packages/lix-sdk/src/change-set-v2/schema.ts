import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchemaDefinition } from "../schema/definition.js";

export function applyChangeSetDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE VIEW IF NOT EXISTS change_set AS
	SELECT
		json_extract(snapshot_content, '$.id') AS id,
    json_extract(snapshot_content, '$.metadata') AS metadata
	FROM state
	WHERE schema_key = 'lix_change_set';

  CREATE TRIGGER change_set_insert
  INSTEAD OF INSERT ON change_set
  BEGIN
    INSERT INTO state (
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content
    ) VALUES (
      NEW.id,
      'lix_change_set',
      'lix',
      'lix_own_entity',
      json_object('id', NEW.id, 'metadata', NEW.metadata)
    );
  END;

  CREATE TRIGGER change_set_update
  INSTEAD OF UPDATE ON change_set
  BEGIN
    UPDATE state
    SET
      entity_id = NEW.id,
      schema_key = 'lix_change_set',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object('id', NEW.id, 'metadata', NEW.metadata)
    WHERE
      entity_id = OLD.id
      AND schema_key = 'lix_change_set'
      AND file_id = 'lix';
  END;

  CREATE TRIGGER change_set_delete
  INSTEAD OF DELETE ON change_set
  BEGIN
    DELETE FROM state
    WHERE entity_id = OLD.id
    AND schema_key = 'lix_change_set'
    AND file_id = 'lix';
  END;

  -- change set element

  CREATE VIEW IF NOT EXISTS change_set_element AS
	SELECT
		json_extract(snapshot_content, '$.change_set_id') AS change_set_id,
    json_extract(snapshot_content, '$.change_id') AS change_id,
    json_extract(snapshot_content, '$.entity_id') AS entity_id,
    json_extract(snapshot_content, '$.schema_key') AS schema_key,
    json_extract(snapshot_content, '$.file_id') AS file_id
	FROM state
	WHERE schema_key = 'lix_change_set_element';

  CREATE TRIGGER change_set_element_insert
  INSTEAD OF INSERT ON change_set_element
  BEGIN
    INSERT INTO state (
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content
    ) VALUES (
      NEW.change_set_id || '::' || NEW.change_id,
      'lix_change_set_element',
      'lix',
      'lix_own_entity',
      json_object('change_set_id', NEW.change_set_id, 'change_id', NEW.change_id, 'entity_id', NEW.entity_id, 'schema_key', NEW.schema_key, 'file_id', NEW.file_id)
    );
  END;

  CREATE TRIGGER change_set_element_update
  INSTEAD OF UPDATE ON change_set_element
  BEGIN
    UPDATE state
    SET
      entity_id = NEW.entity_id,
      schema_key = 'lix_change_set_element',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object('change_set_id', NEW.change_set_id, 'change_id', NEW.change_id, 'entity_id', NEW.entity_id, 'schema_key', NEW.schema_key, 'file_id', NEW.file_id)
    WHERE
      entity_id = OLD.change_set_id || '::' || OLD.change_id
      AND schema_key = 'lix_change_set_element'
      AND file_id = 'lix';
  END;

  CREATE TRIGGER change_set_element_delete
  INSTEAD OF DELETE ON change_set_element
  BEGIN
    DELETE FROM state
    WHERE entity_id = OLD.change_set_id || '::' || OLD.change_id
    AND schema_key = 'lix_change_set_element'
    AND file_id = 'lix';
  END;

  -- change set edge

  CREATE VIEW IF NOT EXISTS change_set_edge AS
  SELECT
    json_extract(snapshot_content, '$.parent_id') AS parent_id,
    json_extract(snapshot_content, '$.child_id') AS child_id
  FROM state
  WHERE schema_key = 'lix_change_set_edge';

  CREATE TRIGGER change_set_edge_insert
  INSTEAD OF INSERT ON change_set_edge
  BEGIN
    INSERT INTO state (
      entity_id, schema_key, file_id, plugin_key, snapshot_content
    ) VALUES (
      NEW.parent_id || '::' || NEW.child_id,
      'lix_change_set_edge',
      'lix',
      'lix_own_entity',
      json_object('parent_id', NEW.parent_id, 'child_id', NEW.child_id)
    ); 
  END;

  CREATE TRIGGER change_set_edge_update
  INSTEAD OF UPDATE ON change_set_edge
  BEGIN
    UPDATE state
    SET
      entity_id = NEW.parent_id || '::' || NEW.child_id,
      schema_key = 'lix_change_set_edge',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object('parent_id', NEW.parent_id, 'child_id', NEW.child_id)
    WHERE
      entity_id = OLD.parent_id || '::' || OLD.child_id
      AND schema_key = 'lix_change_set_edge'
      AND file_id = 'lix';
  END;

  CREATE TRIGGER change_set_edge_delete
  INSTEAD OF DELETE ON change_set_edge
  BEGIN
    DELETE FROM state
    WHERE entity_id = OLD.parent_id || '::' || OLD.child_id
    AND schema_key = 'lix_change_set_edge'
    AND file_id = 'lix';
  END;
`;

	return sqlite.exec(sql);
}

export const ChangeSetSchema: LixSchemaDefinition = {
	"x-lix-key": "lix_change_set",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string" },
		metadata: { type: "object", nullable: true },
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

export const ChangeSetElementSchema: LixSchemaDefinition = {
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

export const ChangeSetEdgeSchema: LixSchemaDefinition = {
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
