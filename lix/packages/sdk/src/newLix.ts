import { Kysely, sql } from "kysely";
import {
	createDialect,
	createInMemoryDatabase,
	contentFromDatabase,
} from "sqlite-wasm-kysely";

/**
 * Creates a new lix file.
 *
 * The app is responsible for saving the project "whereever"
 * e.g. the user's computer, cloud storage, or OPFS in the browser.
 */
export async function newLixFile(): Promise<Blob> {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	});

	const db = new Kysely({
		dialect: createDialect({
			database: sqlite,
		}),
	});

	try {
		await sql`
      CREATE TABLE ref (
        name TEXT PRIMARY KEY,
        commit_id TEXT
      );

      CREATE TABLE file_internal (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        data BLOB NOT NULL
      ) strict;
  
      CREATE TABLE change_queue (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_id TEXT,
        path TEXT NOT NULL,
        data BLOB
      ) strict;
  
      create view file as
        select z.id as id, z.path as path, z.data as data, MAX(z.mx) as queue_id from 
          (select file_id as id, path, data, id as mx from change_queue UNION select id, path, data, 0 as mx from file_internal) as z
        group by z.id;
      
      CREATE TABLE change (
        id TEXT PRIMARY KEY,
        author TEXT,
        parent_id TEXT,
        type TEXT NOT NULL,
        file_id TEXT NOT NULL,
        plugin_key TEXT NOT NULL,
        operation TEXT NOT NULL,
        value TEXT,
        meta TEXT,
        commit_id TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      ) strict;

      CREATE TABLE conflict (
        change_id TEXT NOT NULL,
        conflicting_change_id TEXT NOT NULL,
        reason TEXT,
        meta TEXT,
        resolved_with_change_id TEXT,
        PRIMARY KEY (change_id, conflicting_change_id)
      ) strict;
        
      CREATE TABLE 'commit' (
        id TEXT PRIMARY KEY,
        author TEXT,
        parent_id TEXT NOT NULL,
        description TEXT NOT NULL,
        created TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      ) strict;

      INSERT INTO ref values ('current', '00000000-0000-0000-0000-000000000000');

      CREATE TRIGGER file_update INSTEAD OF UPDATE ON file
      BEGIN
        insert into change_queue(file_id, path, data) values(NEW.id, NEW.path, NEW.data);
        select triggerWorker();
      END;

      CREATE TRIGGER file_insert INSTEAD OF INSERT ON file
      BEGIN
        insert into change_queue(file_id, path, data) values(NEW.id, NEW.path, NEW.data);
        select triggerWorker();
      END;

      CREATE TRIGGER change_queue_remove BEFORE DELETE ON change_queue
      BEGIN
        insert or replace into file_internal(id, path, data) values(OLD.file_id, OLD.path, OLD.data);
      END;
    `.execute(db);

		return new Blob([contentFromDatabase(sqlite)]);
	} catch (e) {
		throw new Error(`Failed to create new Lix file: ${e}`, { cause: e });
	} finally {
		// in any case destroy the memory db
		sqlite.close();
		await db.destroy();
	}
}
