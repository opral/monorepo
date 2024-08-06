import { Kysely, sql } from "kysely"
import { createDialect, createInMemoryDatabase, contentFromDatabase } from "sqlite-wasm-kysely"

/**
 * Creates a new lix file.
 *
 * The app is responsible for saving the project "whereever"
 * e.g. the user's computer, cloud storage, or OPFS in the browser.
 */
export async function newLixFile(): Promise<Blob> {
	const sqlite = await createInMemoryDatabase({
		readOnly: false,
	})
	const db = new Kysely({
		dialect: createDialect({
			database: sqlite,
		}),
	})

	try {
		await sql`
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
        value TEXT NULL,
        meta TEXT,
        commit_id TEXT
        ) strict;
        
      CREATE TABLE 'commit' (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        description TEXT NOT NULL,
        zoned_date_time TEXT NOT NULL
      ) strict;
    `.execute(db)

		return new Blob([contentFromDatabase(sqlite)])
	} catch (e) {
		throw new Error(`Failed to create new Lix file: ${e}`, { cause: e })
	} finally {
		// in any case destroy the memory db
		sqlite.close()
		await db.destroy()
	}
}
