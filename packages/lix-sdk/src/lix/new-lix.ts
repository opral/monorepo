import {
	createInMemoryDatabase,
	contentFromDatabase,
} from "sqlite-wasm-kysely";
import { initDb } from "../database/init-db.js";

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

	// applying the schema etc.
	const db = initDb({ sqlite });

	try {
		return new Blob([contentFromDatabase(sqlite)]);
	} catch (e) {
		throw new Error(`Failed to create new Lix file: ${e}`, { cause: e });
	} finally {
		// in any case destroy the memory db
		sqlite.close();
		await db.destroy();
	}
}
