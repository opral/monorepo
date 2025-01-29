import { SqliteAdapter, SqliteIntrospector, SqliteQueryCompiler } from "kysely";
import { SqliteWasmDriver } from "./kysely/SqliteWasmDriver.js";
import { SqliteWasmDatabase } from "./util/createInMemoryDatabase.js";

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
