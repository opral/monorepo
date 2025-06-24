import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import { JSONTypeSchema } from "../schema-definition/json-type.js";
import type {
	LixSchemaDefinition,
	FromLixSchemaDefinition,
} from "../schema-definition/definition.js";
import type { Generated } from "kysely";

export function applySnapshotDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	return sqlite.exec(`
  CREATE TABLE IF NOT EXISTS internal_snapshot (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    content BLOB -- jsonb or binary file
  ) STRICT;

  INSERT OR IGNORE INTO internal_snapshot (id, content)
  VALUES ('no-content', NULL);

  CREATE VIEW IF NOT EXISTS snapshot AS
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
		id: { type: "string", "x-lix-generated": true },
		content: JSONTypeSchema as any,
	},
	required: ["id", "content"],
	additionalProperties: false,
} as const;
LixSnapshotSchema satisfies LixSchemaDefinition;

// Pure business logic type (inferred from schema)
export type Snapshot = FromLixSchemaDefinition<typeof LixSnapshotSchema> & {
	// override the content to any to allow any JSON type (instead of unknown which is annoying)
	content: Record<string, any> | null;
};

export type InternalSnapshotTable = {
	id: Generated<string>;
	content: Record<string, any> | null;
};
