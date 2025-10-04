import { SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import { SqliteWasmDriver } from "./kysely-driver/sqlite-wasm-driver.js";
import type { SqliteWasmDatabase } from "./create-in-memory-database.js";

/**
 * Creates a Kysely dialect that talks to a WebAssembly powered SQLite database.
 *
 * Dialects configure how Kysely executes queries under the hood. The returned
 * dialect wires up the WebAssembly driver, adapter, and introspector so we can
 * use a browser-first SQLite database transparently throughout the SDK.
 *
 * @example
 *   const db = await createInMemoryDatabase({ readOnly: false });
 *   const dialect = createEngineDialect({ database: db });
 */
export const createEngineDialect = (args: { database: SqliteWasmDatabase }) => {
	return {
		createAdapter: (): SqliteAdapter => new SqliteAdapter(),
		createDriver: (): SqliteWasmDriver =>
			new SqliteWasmDriver({
				database: args.database,
			}),
		createIntrospector: (db: any): SqliteIntrospector =>
			new SqliteIntrospector(db),
		createQueryCompiler: (): SqliteQueryCompiler => new SqliteQueryCompiler(),
	};
};
