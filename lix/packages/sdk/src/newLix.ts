import { Kysely } from "kysely";
import {
	createDialect,
	createInMemoryDatabase,
	contentFromDatabase,
} from "sqlite-wasm-kysely";
import { createSchema } from "./database/createSchema.js";

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
		await createSchema({ db });
		return new Blob([contentFromDatabase(sqlite)]);
	} catch (e) {
		throw new Error(`Failed to create new Lix file: ${e}`, { cause: e });
	} finally {
		// in any case destroy the memory db
		sqlite.close();
		await db.destroy();
	}
}
