import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  Generated,
  Kysely,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from "kysely";
import { SqliteWasmDriver } from "../../src/kysely";
import { sleep } from "../test-utils/sleep";
import {
  contentFromDatabase,
  createInMemoryDatabase,
  importDatabase,
} from "../../src";

describe("kysely dialect", async () => {
  // const { dialect, transaction } = new SQLocalKysely(
  // 	'kysely-dialect-test.sqlite3'
  // );

  const sqliteDb1 = await createInMemoryDatabase({
    readOnly: false,
  });

  const db1 = new Kysely<DB>({
    dialect: {
      createAdapter: () => new SqliteAdapter(),
      createDriver: () =>
        new SqliteWasmDriver({
          database: sqliteDb1,
        }),
      createIntrospector: (db) => new SqliteIntrospector(db),
      createQueryCompiler: () => new SqliteQueryCompiler(),
    },
  });

  const sqliteDb2 = await createInMemoryDatabase({
    readOnly: false,
  });

  const db2 = new Kysely<DB>({
    dialect: {
      createAdapter: () => new SqliteAdapter(),
      createDriver: () =>
        new SqliteWasmDriver({
          database: sqliteDb2,
        }),
      createIntrospector: (db) => new SqliteIntrospector(db),
      createQueryCompiler: () => new SqliteQueryCompiler(),
    },
  });

  type DB = {
    groceries: {
      id: Generated<number>;
      name: string;
    };
    prices: {
      id: Generated<number>;
      groceryId: number;
      price: number;
    };
  };

  it("should fill up db1, allow to export and import into db2", async () => {
    await db1.schema
      .createTable("groceries")
      .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement())
      .addColumn("name", "text", (cb) => cb.notNull())
      .execute();

    const items = ["bread", "milk", "rice"];
    for (let item of items) {
      const insert1 = await db1
        .insertInto("groceries")
        .values({ name: item })
        .returning(["name"])
        .execute();
      expect(insert1).toEqual([{ name: item }]);
    }

    const select1 = await db1.selectFrom("groceries").selectAll().execute();
    expect(select1).toEqual([
      { id: 1, name: "bread" },
      { id: 2, name: "milk" },
      { id: 3, name: "rice" },
    ]);

    const db1Content = contentFromDatabase(sqliteDb1);
    importDatabase({
      db: sqliteDb2,
      content: db1Content,
    });

    const select2 = await db2.selectFrom("groceries").selectAll().execute();
    expect(select2).toEqual([
      { id: 1, name: "bread" },
      { id: 2, name: "milk" },
      { id: 3, name: "rice" },
    ]);
  });
});
