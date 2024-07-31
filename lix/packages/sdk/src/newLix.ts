import { SQLocal } from "sqlocal"

/**
 * Creates a new inlang project.
 *
 * The app is responsible for saving the project "whereever"
 * e.g. the user's computer, cloud storage, or OPFS in the browser.
 */
export async function newLixFile(): Promise<Blob> {
	const sqlocal = new SQLocal({
		storage: {
			type: "memory",
		},
	})
	try {
		await sqlocal.sql`
    
  CREATE TABLE 'file' (
    id TEXT PRIMARY KEY,
    path TEXT NOT NULL,
    blob BLOB NOT NULL
    ) strict;
  
  CREATE TABLE change (
    id TEXT PRIMARY KEY,
    parent_id TEXT,
    type TEXT NOT NULL,
    file_id TEXT NOT NULL,
    plugin_key TEXT NOT NULL,
    value TEXT NOT NULL,
    meta TEXT,
    commit_id TEXT
    ) strict;
    
  CREATE TABLE 'commit' (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    description TEXT NOT NULL,
    zoned_date_time TEXT NOT NULL
  ) strict;
  `
		const content = await sqlocal.getDatabaseContent()
		return new Blob([content])
	} catch (e) {
		throw new Error(`Failed to create new Lix file: ${e}`, { cause: e })
	} finally {
		// in any case destroy the memory db
		await sqlocal.destroy()
	}
}
