import { Database } from "@sqlite.org/sqlite-wasm";
import { sqliteModule } from "../kysely/sqlite3InitModule.js";

export const blobFromDatabase = (db: Database) => {
  return sqliteModule.capi.sqlite3_js_db_export(db);
};
