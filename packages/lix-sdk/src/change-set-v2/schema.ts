import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchemaDefinition, FromLixSchemaDefinition } from "../schema-definition/definition.js";
import type { Version } from "../version/schema.js";

export function applyChangeSetDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE VIEW IF NOT EXISTS change_set AS
	SELECT
		json_extract(snapshot_content, '$.id') AS id,
    json_extract(snapshot_content, '$.metadata') AS metadata,
    version_id
	FROM state
	WHERE schema_key = 'lix_change_set';

  CREATE TRIGGER IF NOT EXISTS change_set_insert
  INSTEAD OF INSERT ON change_set
  BEGIN
    INSERT INTO state (
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content,
      version_id
    )
    SELECT
      with_default_values.id,
      'lix_change_set',
      'lix',
      'lix_own_entity',
      json_object('id', with_default_values.id, 'metadata', with_default_values.metadata),
      COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    FROM (
      SELECT
        COALESCE(NEW.id, nano_id()) AS id,
        NEW.metadata AS metadata
    ) AS with_default_values;
  END;

  CREATE TRIGGER IF NOT EXISTS change_set_update
  INSTEAD OF UPDATE ON change_set
  BEGIN
    UPDATE state
    SET
      entity_id = NEW.id,
      schema_key = 'lix_change_set',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object('id', NEW.id, 'metadata', NEW.metadata),
      version_id = COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    WHERE
      entity_id = OLD.id
      AND schema_key = 'lix_change_set'
      AND file_id = 'lix';
  END;

  CREATE TRIGGER IF NOT EXISTS change_set_delete
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
    json_extract(snapshot_content, '$.file_id') AS file_id,
    version_id
	FROM state
	WHERE schema_key = 'lix_change_set_element';

  CREATE TRIGGER IF NOT EXISTS change_set_element_insert
  INSTEAD OF INSERT ON change_set_element
  BEGIN
    INSERT INTO state (
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content,
      version_id
    ) VALUES (
      NEW.change_set_id || '::' || NEW.change_id,
      'lix_change_set_element',
      'lix',
      'lix_own_entity',
      json_object('change_set_id', NEW.change_set_id, 'change_id', NEW.change_id, 'entity_id', NEW.entity_id, 'schema_key', NEW.schema_key, 'file_id', NEW.file_id),
      COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    );
  END;

  CREATE TRIGGER IF NOT EXISTS change_set_element_update
  INSTEAD OF UPDATE ON change_set_element
  BEGIN
    UPDATE state
    SET
      entity_id = NEW.entity_id,
      schema_key = 'lix_change_set_element',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object('change_set_id', NEW.change_set_id, 'change_id', NEW.change_id, 'entity_id', NEW.entity_id, 'schema_key', NEW.schema_key, 'file_id', NEW.file_id),
      version_id = COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    WHERE
      entity_id = OLD.change_set_id || '::' || OLD.change_id
      AND schema_key = 'lix_change_set_element'
      AND file_id = 'lix';
  END;

  CREATE TRIGGER IF NOT EXISTS change_set_element_delete
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
    json_extract(snapshot_content, '$.child_id') AS child_id,
    version_id
  FROM state
  WHERE schema_key = 'lix_change_set_edge';

  CREATE TRIGGER IF NOT EXISTS change_set_edge_insert
  INSTEAD OF INSERT ON change_set_edge
  BEGIN
    INSERT INTO state (
      entity_id, 
      schema_key, 
      file_id, 
      plugin_key, 
      snapshot_content,
      version_id
    ) VALUES (
      NEW.parent_id || '::' || NEW.child_id,
      'lix_change_set_edge',
      'lix',
      'lix_own_entity',
      json_object('parent_id', NEW.parent_id, 'child_id', NEW.child_id),
      COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    ); 
  END;

  CREATE TRIGGER IF NOT EXISTS change_set_edge_update
  INSTEAD OF UPDATE ON change_set_edge
  BEGIN
    UPDATE state
    SET
      entity_id = NEW.parent_id || '::' || NEW.child_id,
      schema_key = 'lix_change_set_edge',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object('parent_id', NEW.parent_id, 'child_id', NEW.child_id),
      version_id = COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    WHERE
      entity_id = OLD.parent_id || '::' || OLD.child_id
      AND schema_key = 'lix_change_set_edge'
      AND file_id = 'lix';
  END;

  CREATE TRIGGER IF NOT EXISTS change_set_edge_delete
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

export const LixChangeSetSchema: LixSchemaDefinition = {
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

// Pure business logic type (inferred from schema)
export type LixChangeSet = FromLixSchemaDefinition<typeof LixChangeSetSchema>;

// Database view type (includes operational columns)
export type ChangeSetView = {
	id: Generated<string>;
	metadata: Record<string, any> | null;
	version_id: Generated<Version["id"]>;
};

// Kysely operation types
export type ChangeSet = Selectable<ChangeSetView>;
export type NewChangeSet = Insertable<ChangeSetView>;
export type ChangeSetUpdate = Updateable<ChangeSetView>;

export const LixChangeSetElementSchema: LixSchemaDefinition = {
	"x-lix-key": "lix_change_set_element",
	"x-lix-version": "1.0",
	"x-lix-foreign-keys": {
		change_set_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
		change_id: {
			schemaKey: "lix_change",
			property: "id",
		},
		schema_key: {
			schemaKey: "lix_stored_schema",
			property: "key",
		},
	},
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

// Pure business logic type (inferred from schema)
export type LixChangeSetElement = FromLixSchemaDefinition<typeof LixChangeSetElementSchema>;

// Database view type (includes operational columns)
export type ChangeSetElementView = {
	change_set_id: string;
	change_id: string;
	entity_id: string;
	schema_key: string;
	file_id: string;
	version_id: Generated<string>;
};

// Kysely operation types
export type ChangeSetElement = Selectable<ChangeSetElementView>;
export type NewChangeSetElement = Insertable<ChangeSetElementView>;
export type ChangeSetElementUpdate = Updateable<ChangeSetElementView>;

export const LixChangeSetEdgeSchema: LixSchemaDefinition = {
	"x-lix-key": "lix_change_set_edge",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["parent_id", "child_id"],
	"x-lix-foreign-keys": {
		parent_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
		child_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
	},
	type: "object",
	properties: {
		parent_id: { type: "string" },
		child_id: { type: "string" },
	},
	required: ["parent_id", "child_id"],
	additionalProperties: false,
};

// Pure business logic type (inferred from schema)
export type LixChangeSetEdge = FromLixSchemaDefinition<typeof LixChangeSetEdgeSchema>;

// Database view type (includes operational columns)
export type ChangeSetEdgeView = {
	parent_id: string;
	child_id: string;
	version_id: Generated<string>;
};

// Kysely operation types
export type ChangeSetEdge = Selectable<ChangeSetEdgeView>;
export type NewChangeSetEdge = Insertable<ChangeSetEdgeView>;
export type ChangeSetEdgeUpdate = Updateable<ChangeSetEdgeView>;

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
