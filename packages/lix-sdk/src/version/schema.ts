import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";

// initial ids (lack of having a separate creation and migration schema)
export const INITIAL_VERSION_ID = "BoIaHTW9ePX6pNc8";
export const INITIAL_CHANGE_SET_ID = "2j9jm90ajc9j90";
export const INITIAL_WORKING_CHANGE_SET_ID = "h2h09ha92jfaw2";
export const INITIAL_GLOBAL_VERSION_CHANGE_SET_ID = "23n0ajsf328ns";
export const INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID = "om3290j08gj8j23";

export function applyVersionDatabaseSchema(sqlite: SqliteWasmDatabase): void {
	sqlite.exec(`
  -- version
  CREATE VIEW IF NOT EXISTS version AS
  SELECT
    json_extract(snapshot_content, '$.id') AS id,
    json_extract(snapshot_content, '$.name') AS name,
    json_extract(snapshot_content, '$.change_set_id') AS change_set_id,
    json_extract(snapshot_content, '$.working_change_set_id') AS working_change_set_id,
    json_extract(snapshot_content, '$.inherits_from_version_id') AS inherits_from_version_id,
    version_id AS state_version_id,
    inherited_from_version_id AS state_inherited_from_version_id
  FROM state
  WHERE schema_key = 'lix_version';
  
  

  `);
  
	sqlite.exec(`

  CREATE TRIGGER IF NOT EXISTS version_insert
  INSTEAD OF INSERT ON version
  BEGIN
      -- Create version state first
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
        'lix_version',
        'lix',
        'lix_own_entity',
        json_object(
          'id', with_default_values.id,                
          'name', with_default_values.name,            
          'change_set_id', NEW.change_set_id,
          'working_change_set_id', NEW.working_change_set_id,
          'inherits_from_version_id', NEW.inherits_from_version_id
        ),
        '${LixVersionSchema["x-lix-version"]}',
        'global'
      FROM (
          SELECT
              COALESCE(NEW.id, nano_id()) AS id,
              COALESCE(NEW.name, human_id()) AS name,
              COALESCE(NEW.inherits_from_version_id, 'global') AS inherits_from_version_id
      ) AS with_default_values;
  END;
  `);
	sqlite.exec(`
CREATE TRIGGER IF NOT EXISTS version_update
INSTEAD OF UPDATE ON version
BEGIN
    UPDATE state
    SET
      entity_id = COALESCE(NEW.id, OLD.id),
      schema_key = 'lix_version',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object(
        'id', COALESCE(NEW.id, OLD.id),
        'name', COALESCE(NEW.name, OLD.name),
        'change_set_id', COALESCE(NEW.change_set_id, OLD.change_set_id),
        'working_change_set_id', COALESCE(NEW.working_change_set_id, OLD.working_change_set_id),
        'inherits_from_version_id', COALESCE(NEW.inherits_from_version_id, OLD.inherits_from_version_id)
      ),
      version_id = 'global'
    WHERE
      entity_id = OLD.id
      AND schema_key = 'lix_version'
      AND file_id = 'lix'
      AND version_id = 'global';
  END;

  CREATE TRIGGER IF NOT EXISTS version_delete
  INSTEAD OF DELETE ON version
  BEGIN
    -- TODO implement CASCADE delete for state

    -- Delete inheritance relationships where this version is a child
    DELETE FROM state
    WHERE schema_key = 'lix_version_inheritance'
    AND json_extract(snapshot_content, '$.child_version_id') = OLD.id;
    
    -- Delete inheritance relationships where this version is a parent
    DELETE FROM state
    WHERE schema_key = 'lix_version_inheritance'
    AND json_extract(snapshot_content, '$.parent_version_id') = OLD.id;
    
    -- Delete the version itself
    DELETE FROM state
    WHERE entity_id = OLD.id
    AND schema_key = 'lix_version'
    AND version_id = 'global';
  END;

  -- active version 
  CREATE VIEW IF NOT EXISTS active_version AS 
  SELECT
    json_extract(snapshot_content, '$.version_id') AS version_id
  FROM state
  WHERE schema_key = 'lix_active_version'
  AND state.version_id = 'global';


  `);
	sqlite.exec(`

  CREATE TRIGGER IF NOT EXISTS active_version_insert
  INSTEAD OF INSERT ON active_version
  BEGIN
    INSERT INTO state (
      entity_id,
      schema_key,
      file_id,
      plugin_key,
      snapshot_content,
      schema_version,
      version_id
    ) VALUES (
      'lix_active_version',
      'lix_active_version',
      'lix',
      'lix_own_entity',
      json_object('version_id', NEW.version_id),
      '${LixActiveVersionSchema["x-lix-version"]}',
      'global'
    );
  END;

  `);
	sqlite.exec(`

  CREATE TRIGGER IF NOT EXISTS active_version_update
  INSTEAD OF UPDATE ON active_version
  BEGIN
    UPDATE state
    SET
      snapshot_content = json_object('version_id', NEW.version_id),
      version_id = 'global'
    WHERE
      entity_id = 'lix_active_version'
      AND schema_key = 'lix_active_version'
      AND file_id = 'lix';
  END;


  `);
	sqlite.exec(`

  CREATE TRIGGER IF NOT EXISTS active_version_delete
  INSTEAD OF DELETE ON active_version
  BEGIN
    DELETE FROM state
    WHERE entity_id = 'lix_active_version'
    AND schema_key = 'lix_active_version';
  END;

  -- Create change sets for global version if they don't exist
	INSERT OR IGNORE INTO change_set (id, state_version_id) VALUES ('${INITIAL_GLOBAL_VERSION_CHANGE_SET_ID}', 'global');
	INSERT OR IGNORE INTO change_set (id, state_version_id) VALUES ('${INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID}', 'global');

	-- Create global version if it doesn't exist
	INSERT OR IGNORE INTO state (
			entity_id,
			schema_key,
			file_id,
			plugin_key,
			snapshot_content,
			schema_version,
			version_id
		) VALUES (
			'global',
			'lix_version',
			'lix',
			'lix_own_entity',
			json_object(
				'id', 'global',
				'name', 'global',
				'change_set_id', '${INITIAL_GLOBAL_VERSION_CHANGE_SET_ID}',
				'working_change_set_id', '${INITIAL_GLOBAL_VERSION_WORKING_CHANGE_SET_ID}'
			),
			'1.0',
			'global'
		);

  -- Create change set for default version if missing
  -- (this is a workaround for not having a separate creation and migration schema's)
  INSERT INTO change_set (id, state_version_id)
  SELECT '${INITIAL_CHANGE_SET_ID}', 'global'
  WHERE NOT EXISTS (SELECT 1 FROM change_set WHERE id = '${INITIAL_CHANGE_SET_ID}');

  `);
	sqlite.exec(`
  -- Insert the default working change set if missing
  -- (this is a workaround for not having a separate creation and migration schema's)
  INSERT INTO change_set (id, state_version_id)
  SELECT '${INITIAL_WORKING_CHANGE_SET_ID}', 'global'
  WHERE NOT EXISTS (SELECT 1 FROM change_set WHERE id = '${INITIAL_WORKING_CHANGE_SET_ID}');


  `);
	sqlite.exec(`
  -- Insert the default version if missing
  -- (this is a workaround for not having a separate creation and migration schema's)
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
    '${INITIAL_VERSION_ID}', 
    'lix_version', 
    'lix', 
    'lix_own_entity', 
    json_object(
      'id', '${INITIAL_VERSION_ID}',                
      'name', 'main',            
      'change_set_id', '${INITIAL_CHANGE_SET_ID}',
      'working_change_set_id', '${INITIAL_WORKING_CHANGE_SET_ID}',
      'inherits_from_version_id', 'global'
    ),
    '${LixVersionSchema["x-lix-version"]}',
    'global'
  WHERE NOT EXISTS (
    SELECT 1 
    FROM state 
    WHERE entity_id = '${INITIAL_VERSION_ID}' 
    AND schema_key = 'lix_version'
  );


  -- Set the default current version to 'main' if both tables are empty
  -- (this is a workaround for not having a separata creation and migration schema's)
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
    'lix_active_version', 
    'lix_active_version', 
    'lix', 
    'lix_own_entity', 
    json_object('version_id', '${INITIAL_VERSION_ID}'), 
    '${LixActiveVersionSchema["x-lix-version"]}',
    'global'
  WHERE NOT EXISTS (
    SELECT 1 
    FROM state 
    WHERE entity_id = 'lix_active_version' 
    AND schema_key = 'lix_active_version'
  );
`);
}

export const LixVersionSchema = {
	"x-lix-key": "lix_version",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-unique": [["working_change_set_id"]],
	"x-lix-foreign-keys": {
		change_set_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
		working_change_set_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
		inherits_from_version_id: {
			schemaKey: "lix_version",
			property: "id",
		},
	},
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
		change_set_id: { type: "string" },
		working_change_set_id: { type: "string" },
		inherits_from_version_id: { type: ["string", "null"] },
	},
	required: ["id", "name", "change_set_id", "working_change_set_id"],
	additionalProperties: false,
} as const;
LixVersionSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixVersion = FromLixSchemaDefinition<typeof LixVersionSchema>;

// Database view type (includes operational columns)
export type VersionView = {
	id: Generated<string>;
	name: Generated<string>;
	change_set_id: string;
	working_change_set_id: string;
	inherits_from_version_id: string | null;
	state_version_id: Generated<string>;
	state_inherited_from_version_id: Generated<string | null>;
};

// Kysely operation types
export type Version = Selectable<VersionView>;
export type NewVersion = Insertable<VersionView>;
export type VersionUpdate = Updateable<VersionView>;

export const LixActiveVersionSchema = {
	"x-lix-key": "lix_active_version",
	"x-lix-version": "1.0",
	"x-lix-unique": [["version_id"]],
	"x-lix-foreign-keys": {
		version_id: {
			schemaKey: "lix_version",
			property: "id",
		},
	},
	type: "object",
	properties: {
		version_id: { type: "string" },
	},
	required: ["version_id"],
	additionalProperties: false,
} as const;
LixActiveVersionSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixActiveVersion = FromLixSchemaDefinition<
	typeof LixActiveVersionSchema
>;

// Database view type (includes operational columns)
export type ActiveVersionView = {
	version_id: Generated<string>;
};

// Kysely operation types
export type ActiveVersion = Selectable<ActiveVersionView>;
export type NewActiveVersion = Insertable<ActiveVersionView>;
export type ActiveVersionUpdate = Updateable<ActiveVersionView>;
