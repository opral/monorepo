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

      CREATE TABLE 'file' (
        id TEXT PRIMARY KEY,
        path TEXT NOT NULL,
        data BLOB NOT NULL
      ) strict;
      
      CREATE TABLE change (
        id TEXT PRIMARY KEY,
        parent_id TEXT,
        type TEXT NOT NULL,
        file_id TEXT NOT NULL,
        plugin_key TEXT NOT NULL,
        operation TEXT NOT NULL,
        value TEXT,
        meta TEXT,
        commit_id TEXT
      ) strict;
        
      CREATE TABLE 'commit' (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        parent_id TEXT NOT NULL,
        description TEXT NOT NULL,
        created TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
      ) strict;

      INSERT INTO ref values ('current', '00000000-0000-0000-0000-000000000000');
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
