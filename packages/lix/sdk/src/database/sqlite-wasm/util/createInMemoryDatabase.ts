import sqlite3InitModule from "@sqlite.org/sqlite-wasm";
import type { Database, Sqlite3Static } from "@sqlite.org/sqlite-wasm";
import { wasmBinary } from "./sqliteWasmBinary.js";

// https://github.com/opral/lix-sdk/issues/231
// @ts-expect-error -  globalThis
globalThis.sqlite3ApiConfig = {
	warn: (message: string, details: any) => {
		if (message === "Ignoring inability to install OPFS sqlite3_vfs:") {
			// filter out
			return;
		}
		console.log(message + " " + details);
	},
};

export type SqliteWasmDatabase = Database & {
	/**
	 * The sqlite3 module used to create the database.
	 *
	 * Use this API to access the sqlite3 module directly.
	 */
	sqlite3: Sqlite3Static;
};

let sqlite3: Sqlite3Static;

/**
 * Boots a WebAssembly SQLite database that operates entirely in memory.
 *
 * The first call lazily initialises the SQLite WASM module and caches it so
 * subsequent invocations reuse the same runtime. Pass `readOnly: true` to
 * obtain a database instance that prevents writes.
 *
 * @example
 *   const db = await createInMemoryDatabase({ readOnly: false });
 */
export const createInMemoryDatabase = async ({
	readOnly = false,
}: {
	readOnly?: boolean;
}): Promise<SqliteWasmDatabase> => {
	if (sqlite3 === undefined) {
		// avoiding a top level await by initializing the module here
		sqlite3 = await sqlite3InitModule({
			// @ts-expect-error
			wasmBinary: wasmBinary,
			// https://github.com/opral/inlang-sdk/issues/170#issuecomment-2334768193
			locateFile: () => "sqlite3.wasm",
		});
	}
	const flags = [
		readOnly ? "r" : "cw", // read and write
		"", // non verbose
	].join("");

	const db = new sqlite3.oo1.DB(":memory:", flags);
	// @ts-expect-error - assigning new type
	db.sqlite3 = sqlite3;
	return db as SqliteWasmDatabase;
};
