import { SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import { SqliteWasmDriver } from "./kysely/SqliteWasmDriver.js";
import type { SqliteWasmDatabase } from "./util/createInMemoryDatabase.js";

/**
 * Creates a Kysely dialect that talks to a WebAssembly powered SQLite database.
 *
 * Dialects configure how Kysely executes queries under the hood. The returned
 * dialect wires up the WebAssembly driver, adapter, and introspector so we can
 * use a browser-first SQLite database transparently throughout the SDK.
 *
 * @example
 *   const db = await createInMemoryDatabase({ readOnly: false });
 *   const dialect = createDialect({ database: db });
 */
export const createDialect = (args: { database: SqliteWasmDatabase }) => {
	return {
		createAdapter: () => new SqliteAdapter(),
		createDriver: () =>
			new SqliteWasmDriver({
				database: args.database,
			}),
		createIntrospector: (db: any) => new SqliteIntrospector(db),
		createQueryCompiler: () => new SqliteQueryCompiler(),
	};
};
