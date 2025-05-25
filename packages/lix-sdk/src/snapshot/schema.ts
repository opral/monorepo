import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { Selectable, Insertable, Updateable, Generated } from "kysely";
import {
	type JSONType,
	JSONTypeSchema,
} from "../schema-definition/json-type.js";
import type { LixSchemaDefinition, FromLixSchemaDefinition } from "../schema-definition/definition.js";

export function applySnapshotDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	return sqlite.exec(`
  CREATE TABLE IF NOT EXISTS internal_snapshot (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    content BLOB -- jsonb or binary file
  ) STRICT;

  INSERT INTO internal_snapshot (id, content)
  VALUES ('no-content', NULL);

  CREATE VIEW snapshot AS
  SELECT 
    internal_snapshot.id as id, 
    json(internal_snapshot.content) 
  AS content FROM internal_snapshot;

  -- Triggers for 'snapshot' view to make it updatable
  CREATE TRIGGER IF NOT EXISTS snapshot_insert_trigger
  INSTEAD OF INSERT ON snapshot
  FOR EACH ROW
  BEGIN
    INSERT INTO internal_snapshot (id, content)
    VALUES (COALESCE(NEW.id, uuid_v7()), jsonb(NEW.content));
  END;

  CREATE TRIGGER IF NOT EXISTS snapshot_delete_trigger
  INSTEAD OF DELETE ON snapshot
  FOR EACH ROW
  BEGIN
    DELETE FROM internal_snapshot
    WHERE id = OLD.id;
  END;
`);
}

export const LixSnapshotSchema = {
	"x-lix-key": "lix_snapshot",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
	type: "object",
	properties: {
		id: { type: "string" },
		content: JSONTypeSchema as any,
	},
	required: ["id", "content"],
} as const;
LixSnapshotSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type LixSnapshot = FromLixSchemaDefinition<typeof LixSnapshotSchema>;

// Types for the internal_snapshot TABLE
export type InternalSnapshot = Selectable<InternalSnapshotTable>;
export type NewInternalSnapshot = Insertable<InternalSnapshotTable>;
export type InternalSnapshotTable = {
	id: Generated<string>;
	content: JSONType;
};

// Database view type (includes operational columns)
export type SnapshotView = {
	id: Generated<string>;
	content: JSONType;
};

// Kysely operation types
export type Snapshot = Selectable<SnapshotView>;
export type NewSnapshot = Insertable<SnapshotView>;
export type SnapshotUpdate = Updateable<SnapshotView>;
