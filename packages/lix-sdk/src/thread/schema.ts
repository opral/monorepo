import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { LixSchemaDefinition, FromLixSchemaDefinition } from "../schema-definition/definition.js";
import { ZettelDocJsonSchema, type ZettelDoc } from "@opral/zettel-ast";

export function applyThreadDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE VIEW IF NOT EXISTS thread AS
	SELECT
		json_extract(snapshot_content, '$.id') AS id,
    json_extract(snapshot_content, '$.metadata') AS metadata,
    version_id
	FROM state
	WHERE schema_key = 'lix_thread';

  CREATE TRIGGER IF NOT EXISTS thread_insert
  INSTEAD OF INSERT ON thread
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
      'lix_thread',
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

  CREATE TRIGGER IF NOT EXISTS thread_update
  INSTEAD OF UPDATE ON thread
  BEGIN
    UPDATE state
    SET
      entity_id = NEW.id,
      schema_key = 'lix_thread',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object('id', NEW.id, 'metadata', NEW.metadata),
      version_id = COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    WHERE
      entity_id = OLD.id
      AND schema_key = 'lix_thread'
      AND file_id = 'lix';
  END;

  CREATE TRIGGER IF NOT EXISTS thread_delete
  INSTEAD OF DELETE ON thread
  BEGIN
    DELETE FROM state
    WHERE entity_id = OLD.id
    AND schema_key = 'lix_thread'
    AND file_id = 'lix';
  END;

  -- thread comment

  CREATE VIEW IF NOT EXISTS thread_comment AS
	SELECT
		json_extract(snapshot_content, '$.id') AS id,
    json_extract(snapshot_content, '$.thread_id') AS thread_id,
    json_extract(snapshot_content, '$.parent_id') AS parent_id,
    json_extract(snapshot_content, '$.body') AS body,
    datetime(state.created_at) || 'Z' AS created_at,
    version_id
	FROM state
	WHERE schema_key = 'lix_thread_comment';

  CREATE TRIGGER IF NOT EXISTS thread_comment_insert
  INSTEAD OF INSERT ON thread_comment
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
      'lix_thread_comment',
      'lix',
      'lix_own_entity',
      json_object('id', with_default_values.id, 'thread_id', with_default_values.thread_id, 'parent_id', with_default_values.parent_id, 'body', with_default_values.body),
      COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    FROM (
      SELECT
        COALESCE(NEW.id, nano_id()) AS id,
        NEW.thread_id AS thread_id,
        NEW.parent_id AS parent_id,
        NEW.body AS body
    ) AS with_default_values;
  END;

  CREATE TRIGGER IF NOT EXISTS thread_comment_update
  INSTEAD OF UPDATE ON thread_comment
  BEGIN
    UPDATE state
    SET
      entity_id = NEW.id,
      schema_key = 'lix_thread_comment',
      file_id = 'lix',
      plugin_key = 'lix_own_entity',
      snapshot_content = json_object('id', NEW.id, 'thread_id', NEW.thread_id, 'parent_id', NEW.parent_id, 'body', NEW.body),
      version_id = COALESCE(NEW.version_id, (SELECT version_id FROM active_version))
    WHERE
      entity_id = OLD.id
      AND schema_key = 'lix_thread_comment'
      AND file_id = 'lix';
  END;

  CREATE TRIGGER IF NOT EXISTS thread_comment_delete
  INSTEAD OF DELETE ON thread_comment
  BEGIN
    DELETE FROM state
    WHERE entity_id = OLD.id
    AND schema_key = 'lix_thread_comment'
    AND file_id = 'lix';
  END;
`;

	return sqlite.exec(sql);
}

export const LixThreadSchema: LixSchemaDefinition = {
	"x-lix-key": "lix_thread",
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

export const LixThreadCommentSchema: LixSchemaDefinition = {
	"x-lix-key": "lix_thread_comment",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	"x-lix-foreign-keys": {
		thread_id: {
			schemaKey: "lix_thread",
			property: "id",
		},
		parent_id: {
			schemaKey: "lix_thread_comment",
			property: "id",
		},
	},
	type: "object",
	properties: {
		id: { type: "string" },
		thread_id: { type: "string" },
		parent_id: { type: "string", nullable: true },
		body: ZettelDocJsonSchema,
	},
	required: ["id", "thread_id", "body"],
	additionalProperties: false,
};

// Pure business logic types
export type LixThread = FromLixSchemaDefinition<typeof LixThreadSchema>;
export type LixThreadComment = FromLixSchemaDefinition<typeof LixThreadCommentSchema>;

// Database view types
export type ThreadView = {
	id: Generated<string>;
	metadata: Record<string, any> | null;
	version_id: Generated<string>;
};

export type ThreadCommentView = {
	id: Generated<string>;
	thread_id: string;
	parent_id: string | null;
	body: ZettelDoc;
	created_at: Generated<string>;
	version_id: Generated<string>;
};

// Kysely operation types
export type Thread = Selectable<ThreadView>;
export type NewThread = Insertable<ThreadView>;
export type ThreadUpdate = Updateable<ThreadView>;

export type ThreadComment = Selectable<ThreadCommentView>;
export type NewThreadComment = Insertable<ThreadCommentView>;
export type ThreadCommentUpdate = Updateable<ThreadCommentView>;