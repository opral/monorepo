import { SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import { SqliteWasmDriver } from "./kysely/SqliteWasmDriver.js";
import { Database } from "@eliaspourquoi/sqlite-node-wasm";

export const createDialect = (args: { database: Database }) => {
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
