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
import { createInMemoryDatabase } from "../../src";
import { createDialect } from "../../src/dialect";

describe("kysely dialect", async () => {
  const db = new Kysely<DB>({
    dialect: createDialect({
      database: await createInMemoryDatabase({ readOnly: false }),
    }),
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

  beforeEach(async () => {
    await db.schema
      .createTable("groceries")
      .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement())
      .addColumn("name", "text", (cb) => cb.notNull())
      .execute();
    await db.schema
      .createTable("prices")
      .addColumn("id", "integer", (cb) => cb.primaryKey().autoIncrement())
      .addColumn("groceryId", "integer", (cb) => cb.notNull())
      .addColumn("price", "real", (cb) => cb.notNull())
      .execute();
  });

  afterEach(async () => {
    await db.schema.dropTable("groceries").execute();
    await db.schema.dropTable("prices").execute();
  });

  it("should execute queries", async () => {
    const items = ["bread", "milk", "rice"];
    for (let item of items) {
      const insert1 = await db
        .insertInto("groceries")
        .values({ name: item })
        .returning(["name"])
        .execute();
      expect(insert1).toEqual([{ name: item }]);
    }

    const insert2 = await db
      .insertInto("groceries")
      .values({ name: "schnitzel" })
      // .returning(['name'])
      .execute();

    expect(insert2).toEqual([
      {
        insertId: 4n, // we inserted 3 elemnts starting from 1 - so it shoulud be 4
        numInsertedOrUpdatedRows: 1,
      },
    ]);

    const select1 = await db.selectFrom("groceries").selectAll().execute();
    expect(select1).toEqual([
      { id: 1, name: "bread" },
      { id: 2, name: "milk" },
      { id: 3, name: "rice" },
      { id: 4, name: "schnitzel" },
    ]);

    const delete1 = await db
      .deleteFrom("groceries")
      .where("id", "=", 2)
      .returningAll()
      .execute();
    expect(delete1).toEqual([{ id: 2, name: "milk" }]);

    const delete2 = await db
      .deleteFrom("groceries")
      .where("id", "=", 4)
      .execute();
    expect(delete2).toEqual([{ numDeletedRows: 1 }]);

    const update1 = await db
      .updateTable("groceries")
      .set({ name: "white rice" })
      .where("id", "=", 3)
      .returning(["name"])
      .execute();
    expect(update1).toEqual([{ name: "white rice" }]);

    const update2 = await db
      .updateTable("groceries")
      .set({ name: "white rice" })
      .where("id", "=", 3)
      .execute();
    expect(update2).toEqual([{ numUpdatedRows: 1 }]);

    const select2 = await db
      .selectFrom("groceries")
      .select("name")
      .orderBy("id", "desc")
      .execute();
    expect(select2).toEqual([{ name: "white rice" }, { name: "bread" }]);
  });

  it("should perform successful transaction using sqlocal way", async () => {
    const productName = "rice";
    const productPrice = 2.99;

    const newProductId = await db.transaction().execute(async (tx) => {
      const [product] = await tx
        .insertInto("groceries")
        .values({ name: productName })
        .returningAll()
        .execute();
      await tx
        .insertInto("prices")
        .values({ groceryId: product.id, price: productPrice })
        .execute();
      return product.id;
    });

    expect(newProductId).toBe(1);

    const selectData1 = await db.selectFrom("groceries").selectAll().execute();
    expect(selectData1.length).toBe(1);
    const selectData2 = await db.selectFrom("prices").selectAll().execute();
    expect(selectData2.length).toBe(1);
  });

  it("should rollback failed transaction using sqlocal way", async () => {
    const recordCount = await db
      .transaction()
      .execute(async (tx) => {
        await tx.insertInto("groceries").values({ name: "carrots" }).execute();
        await tx
          .insertInto("groeries" as any)
          .values({ name: "lettuce" })
          .execute();

        const data = tx.selectFrom("groceries").selectAll().execute();
        return (await data).length;
      })
      .catch(() => null);
    expect(recordCount).toBe(null);
    const data = await db.selectFrom("groceries").selectAll().execute();
    expect(data.length).toBe(0);
  });

  it("should isolate transaction mutations using sqlocal way", async () => {
    const order: number[] = [];
    await Promise.all([
      db.transaction().execute(async (tx) => {
        order.push(1);
        tx.insertInto("groceries").values({ name: "a" }).execute();
        await sleep(200);
        order.push(3);
        tx.insertInto("groceries").values({ name: "b" }).execute();
      }),
      (async () => {
        await sleep(100);
        order.push(2);
        await db.updateTable("groceries").set({ name: "x" }).execute();
      })(),
    ]);
    const data = await db.selectFrom("groceries").select(["name"]).execute();
    expect(data).toEqual([{ name: "x" }, { name: "x" }]);
    expect(order).toEqual([1, 2, 3]);
  });

  it("should perform successful transaction using kysely way", async () => {
    await db.transaction().execute(async (tx) => {
      await tx.insertInto("groceries").values({ name: "apples" }).execute();
      await tx.insertInto("groceries").values({ name: "bananas" }).execute();
    });

    const data = await db.selectFrom("groceries").selectAll().execute();
    expect(data.length).toBe(2);
  });

  it("should rollback failed transaction using kysely way", async () => {
    await db
      .transaction()
      .execute(async (tx) => {
        await tx.insertInto("groceries").values({ name: "carrots" }).execute();
        await tx
          .insertInto("groeries" as any)
          .values({ name: "lettuce" })
          .execute();
      })
      .catch(() => {});

    const data = await db.selectFrom("groceries").selectAll().execute();
    expect(data.length).toBe(0);
  });

  it("should isolate transaction mutations using kysely way", async () => {
    const order: number[] = [];

    await Promise.all([
      db.transaction().execute(async (tx) => {
        order.push(1);
        await tx.insertInto("groceries").values({ name: "a" }).execute();
        await sleep(200);
        order.push(3);
        await tx.insertInto("groceries").values({ name: "b" }).execute();
      }),
      (async () => {
        await sleep(100);
        order.push(2);
        await db.updateTable("groceries").set({ name: "x" }).execute();
      })(),
    ]);

    const data = await db.selectFrom("groceries").select(["name"]).execute();

    expect(data).toEqual([{ name: "x" }, { name: "x" }]);
    expect(order).toEqual([1, 2, 3]);
  });

  it("should introspect the database", async () => {
    const schemas = await db.introspection.getSchemas();
    expect(schemas).toEqual([]);

    const tables = await db.introspection.getTables();
    const { name: tableName, columns } = tables[0];
    expect(tableName).toBe("groceries");
    expect(columns).toEqual([
      {
        name: "id",
        dataType: "INTEGER",
        hasDefaultValue: false,
        isAutoIncrementing: true,
        isNullable: true,
      },
      {
        name: "name",
        dataType: "TEXT",
        hasDefaultValue: false,
        isAutoIncrementing: false,
        isNullable: false,
      },
    ]);
  });
});
