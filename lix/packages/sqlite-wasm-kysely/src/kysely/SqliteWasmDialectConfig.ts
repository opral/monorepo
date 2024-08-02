import { DatabaseConnection } from "kysely";
import { Database } from "@eliaspourquoi/sqlite-node-wasm";

export interface SqliteWasmDialectConfig {
  /**
   * An sqlite Database instance or a function that returns one.
   *
   * If a function is provided, it's called once when the first query is executed.
   *
   * https://github.com/JoshuaWise/better-sqlite3/blob/master/docs/api.md#new-databasepath-options
   */
  database: Database | (() => Promise<Database>);
  /**
   * Called once when the first query is executed.
   *
   * This is a Kysely specific feature and does not come from the `better-sqlite3` module.
   */
  onCreateConnection?: (connection: DatabaseConnection) => Promise<void>;
}
