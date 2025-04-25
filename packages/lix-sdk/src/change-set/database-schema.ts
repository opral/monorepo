import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyChangeSetDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE TABLE IF NOT EXISTS change_set (
    id TEXT PRIMARY KEY DEFAULT (uuid_v7()),
    
    -- needs to default to 0 to allow inserting elements 
    -- after creating the change set. SQLite does not 
    -- support statement or on commit triggers (yet).
    immutable_elements INTEGER NOT NULL DEFAULT 0
  ) STRICT;

  CREATE TABLE IF NOT EXISTS change_set_element (
    
    change_set_id TEXT NOT NULL,
    change_id TEXT NOT NULL,

    -- entity changes must be unique per change set
    -- otherwise, a change (not set) graph is required
    -- https://github.com/opral/lix-sdk/issues/290

    entity_id TEXT NOT NULL,
    schema_key TEXT NOT NULL,
    file_id TEXT NOT NULL,
    UNIQUE (change_set_id, entity_id, schema_key, file_id),

    PRIMARY KEY(change_set_id, change_id),
    FOREIGN KEY(change_set_id) REFERENCES change_set(id) ON DELETE CASCADE,    
    FOREIGN KEY (change_id, entity_id, schema_key, file_id) REFERENCES change(id, entity_id, schema_key, file_id) ON DELETE CASCADE
  ) STRICT;

  -- Trigger to prevent INSERTING elements into an immutable change set
  CREATE TRIGGER IF NOT EXISTS prevent_immutable_element_insert
  BEFORE INSERT ON change_set_element
  FOR EACH ROW
  WHEN (SELECT immutable_elements FROM change_set WHERE id = NEW.change_set_id) = 1
  BEGIN
    SELECT RAISE(ABORT, 'Attempted to insert elements into a change set with immutable elements');
  END;

  -- Trigger to prevent UPDATING elements in an immutable change set
  CREATE TRIGGER IF NOT EXISTS prevent_immutable_element_update
  BEFORE UPDATE ON change_set_element
  FOR EACH ROW
  WHEN (SELECT immutable_elements FROM change_set WHERE id = OLD.change_set_id) = 1
  BEGIN
    SELECT RAISE(ABORT, 'Attempted to update elements of a change set with immutable elements');
  END;

  -- Trigger to prevent DELETING elements from an immutable change set
  CREATE TRIGGER IF NOT EXISTS prevent_immutable_element_delete
  BEFORE DELETE ON change_set_element
  FOR EACH ROW
  WHEN (SELECT immutable_elements FROM change_set WHERE id = OLD.change_set_id) = 1
  BEGIN
    SELECT RAISE(ABORT, 'Attempted to delete elements from a change set with immutable elements');
  END;

  -- Trigger to prevent changing the immutable flag once set
  -- CREATE TRIGGER IF NOT EXISTS prevent_immutable_flag_change
  -- BEFORE UPDATE OF immutable_elements ON change_set
  -- FOR EACH ROW
  -- WHEN OLD.immutable_elements = 1 AND NEW.immutable_elements = 0
  -- BEGIN
  --     SELECT RAISE(ABORT, 'Cannot set immutable_elements to false once it was set to true');
  -- END;

  CREATE TABLE IF NOT EXISTS change_set_label (
    change_set_id TEXT NOT NULL,
    label_id TEXT NOT NULL,
    PRIMARY KEY(change_set_id, label_id),
    FOREIGN KEY(label_id) REFERENCES label(id),
    FOREIGN KEY(change_set_id) REFERENCES change_set(id)
  ) STRICT;

  CREATE TABLE IF NOT EXISTS change_set_thread (
    change_set_id TEXT NOT NULL,
    thread_id TEXT NOT NULL,
  
    PRIMARY KEY(change_set_id, thread_id),
    FOREIGN KEY(thread_id) REFERENCES thread(id),
    FOREIGN KEY(change_set_id) REFERENCES change_set(id)
  ) STRICT;
`;

	return sqlite.exec(sql);
}

export type ChangeSet = Selectable<ChangeSetTable>;
export type NewChangeSet = Insertable<ChangeSetTable>;
export type ChangeSetUpdate = Updateable<ChangeSetTable>;
export type ChangeSetTable = {
	id: Generated<string>;
	/**
	 * Carefull (!) when querying the database. The return value will be `0` or `1`.
	 * SQLite does not have a boolean select type https://www.sqlite.org/datatype3.html.
	 */
	immutable_elements: Generated<boolean>;
};

export type ChangeSetElement = Selectable<ChangeSetElementTable>;
export type NewChangeSetElement = Insertable<ChangeSetElementTable>;
export type ChangeSetElementUpdate = Updateable<ChangeSetElementTable>;
export type ChangeSetElementTable = {
	change_set_id: string;
	change_id: string;
	entity_id: string;
	schema_key: string;
	file_id: string;
};

export type ChangeSetLabel = Selectable<ChangeSetLabelTable>;
export type NewChangeSetLabel = Insertable<ChangeSetLabelTable>;
export type ChangeSetLabelUpdate = Updateable<ChangeSetLabelTable>;
export type ChangeSetLabelTable = {
	label_id: string;
	change_set_id: string;
};

export type ChangeSetThread = Selectable<ChangeSetThreadTable>;
export type NewChangeSetThread = Insertable<ChangeSetThreadTable>;
export type ChangeSetThreadUpdate = Updateable<ChangeSetThreadTable>;
export type ChangeSetThreadTable = {
	change_set_id: string;
	thread_id: string;
};
