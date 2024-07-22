import { SQLocal } from "sqlocal"
import { defaultProjectSettings } from "./defaultProjectSettings.js"
import type { ProjectSettings2 } from "./types/project-settings.js"

/**
 * Creates a new inlang project.
 *
 * The app is responsible for saving the project "whereever"
 * e.g. the user's computer, cloud storage, or OPFS in the browser.
 */
export async function newProjectOpfs(args: {
	inlangFolderPath: string
	projectSettings?: ProjectSettings2
}) {
	// Request access to the storage directory
	const rootDir = await navigator.storage.getDirectory()

	const projectDir = await rootDir.getDirectoryHandle(args.inlangFolderPath, { create: true })

	const settingsFileHandle = await projectDir.getFileHandle("settings.json", { create: true })

	const writableStream = await settingsFileHandle.createWritable()

	// Write the JSON string to the file
	const settingsText = JSON.stringify(args.projectSettings ?? defaultProjectSettings, undefined, 2)
	await writableStream.write(settingsText)

	// Close the writable stream
	await writableStream.close()

	const sqliteDbFilePath = args.inlangFolderPath + "/inlang.sqlite"
	await projectDir.removeEntry("inlang.sqlite")
	const { sql, destroy } = new SQLocal(sqliteDbFilePath)

	await sql`

  CREATE TABLE Bundle (
    id TEXT PRIMARY KEY,
    alias TEXT NOT NULL
  );

  CREATE TABLE Message (
    id TEXT PRIMARY KEY, 
    bundleId TEXT NOT NULL,
    locale TEXT NOT NULL,
    declarations TEXT NOT NULL,
    selectors TEXT NOT NULL
  );

  CREATE TABLE Variant (
    id TEXT PRIMARY KEY, 
    messageId TEXT NOT NULL,
    match TEXT NOT NULL,
    pattern TEXT NOT NULL
  );
    
  CREATE INDEX idx_message_bundleId ON Message (bundleId);
  CREATE INDEX idx_variant_messageId ON Variant (messageId);

  CREATE TABLE LintReport (
    ruleId TEXT, 
    target TEXT NOT NULL,
    level TEXT NOT NULL,
    body TEXT NOT NULL,
    fixes TEXT
  )
  
    `

	await destroy()
}
