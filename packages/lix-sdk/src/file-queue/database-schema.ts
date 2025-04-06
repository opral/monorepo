import type { Generated, Selectable, Insertable, Updateable } from "kysely";
import type { SqliteWasmDatabase } from "sqlite-wasm-kysely";

export function applyFileQueueDatabaseSchema(
	sqlite: SqliteWasmDatabase
): SqliteWasmDatabase {
	return sqlite.exec`
  CREATE TABLE IF NOT EXISTS file_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_id TEXT NOT NULL,
      data_before BLOB,
      data_after BLOB,
      path_before TEXT,
      path_after TEXT,
      metadata_before BLOB,
      metadata_after BLOB
    ) STRICT;
  
    CREATE TRIGGER IF NOT EXISTS file_insert AFTER INSERT ON file
    BEGIN
      INSERT INTO file_queue(
        file_id, path_after, data_after, metadata_after
      )
      VALUES (
        NEW.id, NEW.path, NEW.data, NEW.metadata
      );
      SELECT triggerFileQueue();
    END;
  
    CREATE TRIGGER IF NOT EXISTS file_update AFTER UPDATE ON file
    BEGIN
      INSERT INTO file_queue(
        file_id, 
        path_before, data_before, metadata_before, 
        path_after, data_after, metadata_after
      )
  
      VALUES (
        NEW.id, 
        OLD.path, OLD.data, OLD.metadata,
        NEW.path, NEW.data, NEW.metadata
      );
  
      SELECT triggerFileQueue();
    END;
  
    CREATE TRIGGER IF NOT EXISTS file_delete BEFORE DELETE ON file
    BEGIN
      INSERT INTO file_queue(file_id)
      VALUES (OLD.id);
      SELECT triggerFileQueue();
    END;
  `;
}

export type FileQueueEntry = Selectable<FileQueueTable>;
export type NewFileQueueEntry = Insertable<FileQueueTable>;
export type FileQueueEntryUpdate = Updateable<FileQueueTable>;
export type FileQueueTable = {
	id: Generated<number>;
	file_id: string;
	data_before: Uint8Array | null;
	data_after: Uint8Array | null;
	path_before: string | null;
	path_after: string | null;
	metadata_before: Uint8Array | null;
	metadata_after: Uint8Array | null;
};
