import { SQLocal } from "sqlocal"

/**
 * Creates a new inlang project.
 *
 * The app is responsible for saving the project "whereever"
 * e.g. the user's computer, cloud storage, or OPFS in the browser.
 */
export async function newLixFile(): Promise<Blob> {
	const opfsRoot = await navigator.storage.getDirectory()
	const interimDbName = `interim_${Math.random()}.lix`
	try {
		const { sql, destroy } = new SQLocal(interimDbName)
		await sql`

    CREATE TABLE file (
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

		const fileHandle = await opfsRoot.getFileHandle(interimDbName)
		const file = await fileHandle.getFile()
		// load db into memory
		const buffer = await file.arrayBuffer()
		// return a blob of the db

		await destroy()
		return new Blob([buffer])
	} finally {
		// in any case remove the interim db
		await opfsRoot.removeEntry(interimDbName)
	}
}
