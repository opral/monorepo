import { newLixFile, openLixFromOpfs, uuidv4 } from "@lix-js/sdk"
import { SQLocalKysely } from "sqlocal/kysely"
import type { ProjectSettings } from "../schema/settings.js"

/**
 * Creates a new inlang project.
 *
 * The app is responsible for saving the project "whereever"
 * e.g. the user's computer, cloud storage, or OPFS in the browser.
 */
export async function newProject(): Promise<Blob> {
	const sqlocal = new SQLocalKysely({
		storage: {
			type: "memory",
		},
	})

	try {
		await sqlocal.sql`
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
		`
		const dbBuffer = await sqlocal.getDatabaseContent()
		// TODO load in memory
		// doesn't work atm because the lix file is not imported with the tables
		// const lix = await openLixInMemory({ blob: await newLixFile() })

		const interimPath = `temporary-${uuidv4()}.lix`
		const opfsRoot = await navigator.storage.getDirectory()
		const fileHandle = await opfsRoot.getFileHandle(interimPath, { create: true })
		const file = await fileHandle.createWritable()
		const lixBlob = await newLixFile()
		await file.write(lixBlob)
		await file.close()
		const lix = await openLixFromOpfs({ path: interimPath })

		// write files to lix
		await lix.db
			.insertInto("file")
			.values([
				{
					// TODO ensure posix paths validation with lix
					path: "/db.sqlite",
					// TODO let lix generate the id
					id: uuidv4(),
					blob: dbBuffer,
				},
				{
					path: "/settings.json",
					id: uuidv4(),
					blob: await new Blob([
						JSON.stringify(defaultProjectSettings, undefined, 2),
					]).arrayBuffer(),
				},
			])
			.execute()
		const blob = await lix.toBlob()
		// delete the interim file from opfs (workaround until in memory exists)
		await opfsRoot.removeEntry(interimPath)
		return blob
	} finally {
		await sqlocal.destroy()
	}
}

const defaultProjectSettings = {
	$schema: "https://inlang.com/schema/project-settings",
	baseLocale: "en",
	locales: ["en", "de"],
	modules: [
		"sdk-dev:opral-uppercase-lint.js",
		"sdk-dev:missing-selector-lint-rule.js",
		"sdk-dev:missing-catchall-variant",
		// for instant gratification, we're adding common rules
		// "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
		// "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
		// "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js",
		// default to the message format plugin because it supports all features
		// "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js",
		// the m function matcher should be installed by default in case Sherlock (VS Code extension) is adopted
		// "https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js",
	],
	"plugin.i18next": {
		pathPattern: "./messages/{languageTag}.json",
	},
} satisfies ProjectSettings
