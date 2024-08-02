import { Database } from "@eliaspourquoi/sqlite-node-wasm";
import { sqliteModule } from "../kysely/sqlite3InitModule.js";

/**
 * Exports the content of a database as a Uint8Array.
 *
 * @example
 *   const db = createInMemoryDatabase({ readOnly: false });
 *   const content = contentFromDatabase(db);
 */
export const contentFromDatabase = (db: Database): Uint8Array => {
  return sqliteModule.capi.sqlite3_js_db_export(db);
};
