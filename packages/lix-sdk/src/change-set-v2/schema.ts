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
      schema_version,
      version_id
    )
    SELECT
      with_default_values.id,
      'lix_change_set',
      'lix',
      'lix_own_entity',
      json_object('id', with_default_values.id, 'metadata', with_default_values.metadata),
      '${LixChangeSetSchema["x-lix-version"]}',
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

  -- TODO expensive graph computation - optimize later
  -- we prob need a general way to cache graph traversals
  -- to speed up this query and all other history related queries
  CREATE VIEW IF NOT EXISTS change_set_element AS
  SELECT * FROM (
    SELECT 
      json_extract(snapshot_content, '$.change_set_id') AS change_set_id,
      json_extract(snapshot_content, '$.change_id') AS change_id,
      json_extract(snapshot_content, '$.entity_id') AS entity_id,
      json_extract(snapshot_content, '$.schema_key') AS schema_key,
      json_extract(snapshot_content, '$.file_id') AS file_id,
      version_id
    FROM state
    WHERE schema_key = 'lix_change_set_element'
    
    UNION ALL
    
    -- Computed elements (from working change sets) - only computed when needed
    SELECT 
      v.working_change_set_id as change_set_id,
      csc.change_id,
      csc.entity_id,
      csc.schema_key,
      csc.file_id,
      v.id as version_id
    FROM version v
    JOIN (
      -- Expensive computation isolated here - only runs when working change sets are queried
      WITH RECURSIVE change_set_ancestry(version_id, change_set_id, depth) AS (
        -- Start from each version's current change_set_id
        SELECT v.id as version_id, v.change_set_id, 0
        FROM version v
        
        UNION ALL
        
        -- Traverse backwards through change set graph
        SELECT csa.version_id, cse.parent_id, csa.depth + 1
        FROM change_set_ancestry csa
        JOIN change_set_edge cse ON cse.child_id = csa.change_set_id
        WHERE csa.depth < 100 -- Prevent infinite recursion
      ),
      last_checkpoint_per_version AS (
        SELECT 
          v.id as version_id,
          COALESCE(
            (
              SELECT MIN(c.created_at)
              FROM change_set_ancestry csa
              JOIN change_set_label csl ON csl.change_set_id = csa.change_set_id
              JOIN label l ON l.id = csl.label_id AND l.name = 'checkpoint'
              JOIN change c ON c.entity_id = csa.change_set_id AND c.schema_key = 'lix_change_set'
              WHERE csa.version_id = v.id
              ORDER BY csa.depth ASC
              LIMIT 1
            ),
            '1970-01-01T00:00:00Z'
          ) as last_checkpoint_time
        FROM version v
      ),
      changes_since_checkpoint AS (
        SELECT 
          json_extract(s.snapshot_content, '$.change_id') as change_id,
          json_extract(s.snapshot_content, '$.entity_id') as entity_id,
          json_extract(s.snapshot_content, '$.schema_key') as schema_key,
          json_extract(s.snapshot_content, '$.file_id') as file_id,
          c.created_at,
          c.snapshot_id,
          v2.id as version_id,
          -- Mark latest change per entity (from change sets, not individual changes)
          ROW_NUMBER() OVER (
            PARTITION BY v2.id, json_extract(s.snapshot_content, '$.entity_id'), json_extract(s.snapshot_content, '$.schema_key'), json_extract(s.snapshot_content, '$.file_id') 
            ORDER BY c.created_at DESC
          ) as rn,
          -- Check if entity existed before checkpoint (for delete reconciliation)
          CASE 
            WHEN c.snapshot_id = 'no-content' THEN (
              -- Check if entity was in any change set at or before checkpoint
              SELECT COUNT(*) 
              FROM change_set_ancestry csa_before
              JOIN state s_before ON s_before.schema_key = 'lix_change_set_element' 
                AND json_extract(s_before.snapshot_content, '$.change_set_id') = csa_before.change_set_id
              JOIN change c_before ON c_before.id = json_extract(s_before.snapshot_content, '$.change_id')
              JOIN last_checkpoint_per_version lcp3 ON lcp3.version_id = v2.id
              WHERE csa_before.version_id = v2.id
              AND json_extract(s_before.snapshot_content, '$.entity_id') = json_extract(s.snapshot_content, '$.entity_id')
              AND json_extract(s_before.snapshot_content, '$.schema_key') = json_extract(s.snapshot_content, '$.schema_key')
              AND json_extract(s_before.snapshot_content, '$.file_id') = json_extract(s.snapshot_content, '$.file_id')
              AND c_before.created_at <= lcp3.last_checkpoint_time
              AND c_before.snapshot_id != 'no-content'
            )
            ELSE 1
          END as existed_before_checkpoint
        FROM change_set_ancestry csa
        JOIN state s ON s.schema_key = 'lix_change_set_element' 
          AND json_extract(s.snapshot_content, '$.change_set_id') = csa.change_set_id
          AND s.version_id = csa.version_id
        JOIN change c ON c.id = json_extract(s.snapshot_content, '$.change_id')
        CROSS JOIN version v2  -- Get changes for each version context
        JOIN last_checkpoint_per_version lcp2 ON lcp2.version_id = v2.id
        WHERE csa.version_id = v2.id
        AND c.created_at > lcp2.last_checkpoint_time
      )
      SELECT 
        csc.change_id,
        csc.entity_id,
        csc.schema_key,
        csc.file_id,
        csc.version_id
      FROM changes_since_checkpoint csc
      WHERE csc.rn = 1  -- Latest change per entity
      AND NOT (
        -- Exclude entities that were added after checkpoint and then deleted
        csc.snapshot_id = 'no-content' 
        AND csc.existed_before_checkpoint = 0
      )
      -- Note: We include deletions (snapshot_id = 'no-content') if entity existed before checkpoint
    ) csc ON csc.version_id = v.id
  );

  CREATE TRIGGER IF NOT EXISTS change_set_element_insert
  INSTEAD OF INSERT ON change_set_element
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
      NEW.change_set_id || '::' || NEW.change_id,
      'lix_change_set_element',
      'lix',
      'lix_own_entity',
      json_object('change_set_id', NEW.change_set_id, 'change_id', NEW.change_id, 'entity_id', NEW.entity_id, 'schema_key', NEW.schema_key, 'file_id', NEW.file_id),
      '${LixChangeSetElementSchema["x-lix-version"]}',
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
      schema_version,
      version_id
    ) VALUES (
      NEW.parent_id || '::' || NEW.child_id,
      'lix_change_set_edge',
      'lix',
      'lix_own_entity',
      json_object('parent_id', NEW.parent_id, 'child_id', NEW.child_id),
      '${LixChangeSetEdgeSchema["x-lix-version"]}',
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

  -- change set label

  CREATE VIEW IF NOT EXISTS change_set_label AS
  SELECT
    json_extract(snapshot_content, '$.change_set_id') AS change_set_id,
    json_extract(snapshot_content, '$.label_id') AS label_id,
    json_extract(snapshot_content, '$.metadata') AS metadata,
    version_id
  FROM state
  WHERE schema_key = 'lix_change_set_label';

  CREATE TRIGGER IF NOT EXISTS change_set_label_insert
  INSTEAD OF INSERT ON change_set_label
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
      NEW.change_set_id || '::' || NEW.label_id,
      'lix_change_set_label',
      'lix',
      'lix_own_entity',
      json_object('change_set_id', NEW.change_set_id, 'label_id', NEW.label_id, 'metadata', NEW.metadata),
      '${LixChangeSetLabelSchema["x-lix-version"]}',
      COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    ); 
  END;

  CREATE TRIGGER IF NOT EXISTS change_set_label_update
  INSTEAD OF UPDATE ON change_set_label
  BEGIN
    UPDATE state
    SET
      entity_id = NEW.change_set_id || '::' || NEW.label_id,
      schema_key = 'lix_change_set_label',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object('change_set_id', NEW.change_set_id, 'label_id', NEW.label_id, 'metadata', NEW.metadata),
      version_id = COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    WHERE
      entity_id = OLD.change_set_id || '::' || OLD.label_id
      AND schema_key = 'lix_change_set_label'
      AND file_id = 'lix';
  END;

  CREATE TRIGGER IF NOT EXISTS change_set_label_delete
  INSTEAD OF DELETE ON change_set_label
  BEGIN
    DELETE FROM state
    WHERE entity_id = OLD.change_set_id || '::' || OLD.label_id
    AND schema_key = 'lix_change_set_label'
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
	"x-lix-unique": [["change_set_id", "entity_id", "schema_key", "file_id"]],
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

export const LixChangeSetLabelSchema: LixSchemaDefinition = {
	"x-lix-key": "lix_change_set_label",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["change_set_id", "label_id"],
	"x-lix-foreign-keys": {
		change_set_id: {
			schemaKey: "lix_change_set",
			property: "id",
		},
		label_id: {
			schemaKey: "lix_label", 
			property: "id",
		},
	},
	type: "object",
	properties: {
		change_set_id: { type: "string" },
		label_id: { type: "string" },
		metadata: { type: "object", nullable: true },
	},
	required: ["change_set_id", "label_id"],
	additionalProperties: false,
};

// Pure business logic type (inferred from schema)
export type LixChangeSetLabel = FromLixSchemaDefinition<typeof LixChangeSetLabelSchema>;

// Database view type (includes operational columns)
export type ChangeSetLabelView = {
	change_set_id: string;
	label_id: string;
	metadata: Record<string, any> | null;
	version_id: Generated<string>;
};

// Kysely operation types
export type ChangeSetLabel = Selectable<ChangeSetLabelView>;
export type NewChangeSetLabel = Insertable<ChangeSetLabelView>;
export type ChangeSetLabelUpdate = Updateable<ChangeSetLabelView>;

// export type ChangeSetThread = Selectable<ChangeSetThreadTable>;
// export type NewChangeSetThread = Insertable<ChangeSetThreadTable>;
// export type ChangeSetThreadUpdate = Updateable<ChangeSetThreadTable>;
// export type ChangeSetThreadTable = {
// 	change_set_id: string;
// 	thread_id: string;
// };
