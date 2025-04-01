import type { Generated, Insertable, Selectable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyChangeSetDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	const sql = `
  CREATE TABLE IF NOT EXISTS change_set (
    id TEXT PRIMARY KEY DEFAULT (nano_id(16))
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

  CREATE TABLE IF NOT EXISTS change_set_label (
    label_id TEXT NOT NULL,
    change_set_id TEXT NOT NULL,
    PRIMARY KEY(label_id, change_set_id),
    FOREIGN KEY(label_id) REFERENCES label(id),
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
