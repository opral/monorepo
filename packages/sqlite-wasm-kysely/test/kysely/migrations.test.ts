import { afterEach, describe, expect, it } from "vitest";
import { SqliteWasmDriver } from "../../src/kysely";
import {
  Kysely,
  Migrator,
  SqliteAdapter,
  SqliteIntrospector,
  SqliteQueryCompiler,
} from "kysely";
import { createInMemoryDatabase } from "../../src";

describe("kysely migrations", async () => {
  const database = await createInMemoryDatabase({
    readOnly: false,
  });
  const dialect = {
    createAdapter: () => new SqliteAdapter(),
    createDriver: () =>
      new SqliteWasmDriver({
        database,
      }),
    createIntrospector: (db) => new SqliteIntrospector(db),
    createQueryCompiler: () => new SqliteQueryCompiler(),
  };
  const db = new Kysely({
    dialect: dialect,
  });

  const migrator = new Migrator({
    db,
    provider: {
      async getMigrations() {
        const { migrations } = await import("./migrations");
        return migrations;
      },
    },
  });

  const getTableNames = async () => {
    const tables = await db.introspection.getTables();
    return tables.map((table) => table.name);
  };

  const getColumnNames = async (tableName: string) => {
    const tables = await db.introspection.getTables();
    const table = tables.find((table) => table.name === tableName);
    return table?.columns.map((column) => column.name);
  };

  afterEach(async () => {
    // const opfs = await navigator.storage.getDirectory();
    // await opfs.removeEntry(databasePath);
  });

  it("should migrate the database", async () => {
    expect(await getTableNames()).toEqual([]);

    await migrator.migrateToLatest();
    expect(await getTableNames()).toEqual(["groceries"]);
    expect(await getColumnNames("groceries")).toEqual([
      "id",
      "name",
      "quantity",
    ]);

    await migrator.migrateDown();
    expect(await getTableNames()).toEqual(["groceries"]);
    expect(await getColumnNames("groceries")).toEqual(["id", "name"]);

    await migrator.migrateDown();
    expect(await getTableNames()).toEqual([]);

    await migrator.migrateUp();
    expect(await getTableNames()).toEqual(["groceries"]);
    expect(await getColumnNames("groceries")).toEqual(["id", "name"]);

    await migrator.migrateDown();
    expect(await getTableNames()).toEqual([]);
  });
});
