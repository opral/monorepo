import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";
import type { JSONType } from "../schema/json-type.js";

export function applyStateDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE VIEW IF NOT EXISTS state AS
  SELECT
    ic.entity_id,
    ic.schema_key,
    ic.file_id,
    ic.plugin_key,
    json(s.content) AS snapshot_content
  FROM internal_change ic
  LEFT JOIN internal_snapshot s ON ic.snapshot_id = s.id
  WHERE ic.snapshot_id != 'no-content'
  AND ic.rowid = (
    SELECT MAX(ic2.rowid)
    FROM internal_change ic2
    WHERE ic2.entity_id = ic.entity_id
      AND ic2.schema_key = ic.schema_key
      AND ic2.file_id = ic.file_id
  );

  CREATE TRIGGER IF NOT EXISTS state_insert
  INSTEAD OF INSERT ON state
  BEGIN
    INSERT INTO internal_snapshot (content) VALUES (jsonb(NEW.snapshot_content));

    INSERT INTO internal_change (
      entity_id, schema_key, file_id, plugin_key, snapshot_id
    ) VALUES (
      NEW.entity_id,
      NEW.schema_key,
      NEW.file_id,
      NEW.plugin_key,
      (SELECT id FROM internal_snapshot ORDER BY rowid DESC LIMIT 1)
    );
  END;

  CREATE TRIGGER IF NOT EXISTS state_update
  INSTEAD OF UPDATE ON state
  BEGIN
    INSERT INTO internal_snapshot (content) VALUES (jsonb(NEW.snapshot_content));

    INSERT INTO internal_change (
      entity_id, schema_key, file_id, plugin_key, snapshot_id
    ) VALUES (
      NEW.entity_id,
      NEW.schema_key,
      NEW.file_id,
      NEW.plugin_key,
      (SELECT id FROM internal_snapshot ORDER BY rowid DESC LIMIT 1)
    );
  END;

  CREATE TRIGGER IF NOT EXISTS state_delete
  INSTEAD OF DELETE ON state
  BEGIN
    INSERT INTO internal_change (
      entity_id, schema_key, file_id, plugin_key, snapshot_id
    ) VALUES (
      OLD.entity_id,
      OLD.schema_key,
      OLD.file_id,
      OLD.plugin_key,
      'no-content'
    );
  END;
`;

	return sqlite.exec(sql);
}

export type State = Selectable<StateView>;
export type NewState = Insertable<StateView>;
export type StateUpdate = Updateable<StateView>;
export type StateView = {
	entity_id: Generated<string>;
	schema_key: string;
	file_id: string;
	plugin_key: string;
	snapshot_content: JSONType;
};
