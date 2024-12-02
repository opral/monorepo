import type { SqliteDatabase } from "sqlite-wasm-kysely";

export function applyOwnEntityChangeControlTriggers(
	sqlite: SqliteDatabase,
): SqliteDatabase {
	return sqlite.exec`
  CREATE TRIGGER IF NOT EXISTS key_value_insert
  AFTER INSERT ON key_value
  BEGIN
    SELECT handle_lix_own_entity_change('key_value', NEW.key, NEW.value);
  END;

  CREATE TRIGGER IF NOT EXISTS key_value_update
  AFTER UPDATE ON key_value
  BEGIN
    SELECT handle_lix_own_entity_change('key_value', NEW.key, NEW.value);
  END;

  CREATE TRIGGER IF NOT EXISTS key_value_delete
  AFTER DELETE ON key_value
  BEGIN
    SELECT handle_lix_own_entity_change('key_value', OLD.key, NULL);
  END;
`;
}
