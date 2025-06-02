import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchemaDefinition, FromLixSchemaDefinition } from "../schema-definition/definition.js";

export function applyLabelDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE VIEW IF NOT EXISTS label AS
	SELECT
		json_extract(snapshot_content, '$.id') AS id,
    json_extract(snapshot_content, '$.name') AS name,
    version_id
	FROM state
	WHERE schema_key = 'lix_label';

  CREATE TRIGGER IF NOT EXISTS label_insert
  INSTEAD OF INSERT ON label
  BEGIN
    INSERT INTO state (
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content,
      schema_version,
      version_id
    )
    SELECT
      with_default_values.id,
      'lix_label',
      'lix',
      'lix_own_entity',
      json_object('id', with_default_values.id, 'name', with_default_values.name),
      '${LixLabelSchema["x-lix-version"]}',
      COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    FROM (
      SELECT
        COALESCE(NEW.id, nano_id()) AS id,
        NEW.name AS name
    ) AS with_default_values;
  END;

  CREATE TRIGGER IF NOT EXISTS label_update
  INSTEAD OF UPDATE ON label
  BEGIN
    UPDATE state
    SET
      entity_id = NEW.id,
      schema_key = 'lix_label',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object('id', NEW.id, 'name', NEW.name),
      version_id = COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    WHERE
      entity_id = OLD.id
      AND schema_key = 'lix_label'
      AND file_id = 'lix';
  END;

  CREATE TRIGGER IF NOT EXISTS label_delete
  INSTEAD OF DELETE ON label
  BEGIN
    DELETE FROM state
    WHERE entity_id = OLD.id
    AND schema_key = 'lix_label'
    AND file_id = 'lix';
  END;

  -- Insert the default checkpoint label if missing
  -- (this is a workaround for not having a separate creation and migration schema)
  INSERT INTO state (
    entity_id, 
    schema_key, 
    file_id, 
    plugin_key, 
    snapshot_content, 
    schema_version,
    version_id
  )
  SELECT 
    nano_id(), 
    'lix_label', 
    'lix', 
    'lix_own_entity', 
    json_object('id', nano_id(), 'name', 'checkpoint'), 
    '${LixLabelSchema["x-lix-version"]}',
    (SELECT version_id FROM active_version LIMIT 1)
  WHERE NOT EXISTS (
    SELECT 1 
    FROM state 
    WHERE json_extract(snapshot_content, '$.name') = 'checkpoint'
    AND schema_key = 'lix_label'
  );
`;

	return sqlite.exec(sql);
}

export const LixLabelSchema: LixSchemaDefinition = {
	"x-lix-key": "lix_label",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
	},
	required: ["id", "name"],
	additionalProperties: false,
};

// Pure business logic type (inferred from schema)
export type LixLabel = FromLixSchemaDefinition<typeof LixLabelSchema>;

// Database view type (includes operational columns)
export type LabelView = {
	id: Generated<string>;
	name: string;
	version_id: Generated<string>;
};

// Kysely operation types
export type Label = Selectable<LabelView>;
export type NewLabel = Insertable<LabelView>;
export type LabelUpdate = Updateable<LabelView>;