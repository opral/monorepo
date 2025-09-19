import { createInMemoryDatabase } from "./createInMemoryDatabase.js";
import { importDatabase } from "./importDatabase.js";

/**
 * Convenience helper that instantiates a database and hydrates it from bytes.
 *
 * This combines {@link createInMemoryDatabase} and {@link importDatabase} so
 * callers can go from raw ArrayBuffer data to a ready-to-use database in one
 * call.
 *
 * @example
 *   const db = await loadDatabaseInMemory(await fetch("/db.sqlite").then(r => r.arrayBuffer()));
 */
export async function loadDatabaseInMemory(data: ArrayBuffer) {
	const database = await createInMemoryDatabase({
		readOnly: false,
	});
	importDatabase({
		db: database,
		content: new Uint8Array(data),
	});
	return database;
}
