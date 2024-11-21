import { Kysely, sql, type Generated } from "kysely";
import { expect, test } from "vitest";
import { createDialect, createInMemoryDatabase } from "sqlite-wasm-kysely";
import { ParseJsonBPluginV1 } from "./parse-jsonb-plugin-v1.js";

test("select()", async () => {
	const db = await mockDatabase();

	await db
		.insertInto("mock_table")
		.values({
			metadata: new TextEncoder().encode(JSON.stringify({ a: 1 })),
			other: "value",
			just_blob: new TextEncoder().encode("{mock blob value that's not a json"),
		})
		.execute();

	const result = await db
		.selectFrom("mock_table")
		.select("metadata")
		.executeTakeFirst();

	expect(result).toEqual({ metadata: { a: 1 } });
});

test("select() with alias on the column is expected to fail", async () => {
	const db = await mockDatabase();

	await db
		.insertInto("mock_table")
		.values({
			metadata: new TextEncoder().encode(JSON.stringify({ a: 1 })),
			other: "value",
			just_blob: new TextEncoder().encode("{mock blob value that's not a json"),
		})
		.execute();

	const result = await db
		.selectFrom("mock_table")
		.select("metadata as jc")
		.executeTakeFirst();

	expect(result).not.toEqual({ jc: { a: 1 } });
});

test("select() with joins should work as long as no aliases are used", async () => {
	const db = await mockDatabase();

	const insert = await db
		.insertInto("mock_table")
		.values({
			metadata: new TextEncoder().encode(JSON.stringify({ a: 1 })),
			other: "value",
			just_blob: new TextEncoder().encode("{mock blob value that's not a json"),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await db
		.insertInto("other_table")
		.values({
			mock_table_id: insert.id,
			content: new TextEncoder().encode(JSON.stringify({ b: 2 })),
		})
		.execute();

	const result0 = await db
		.selectFrom("mock_table")
		.innerJoin("other_table", "mock_table.id", "other_table.mock_table_id")
		.select("mock_table.metadata")
		.executeTakeFirst();

	expect(result0).toEqual({ metadata: { a: 1 } });

	// other way around
	const result1 = await db
		.selectFrom("mock_table")
		.innerJoin("other_table", "mock_table.id", "other_table.mock_table_id")
		.select("other_table.content")
		.executeTakeFirst();

	expect(result1).toEqual({ content: { b: 2 } });
});

test("selectAll() without aliases should work", async () => {
	const db = await mockDatabase();

	await db
		.insertInto("mock_table")
		.values({
			metadata: new TextEncoder().encode(JSON.stringify({ a: 1 })),
			other: "value",
			just_blob: new TextEncoder().encode("{mock blob value that's not a json"),
		})
		.execute();

	const result = await db
		.selectFrom("mock_table")
		.selectAll()
		.executeTakeFirst();

	expect(result?.metadata).toStrictEqual({ a: 1 });
	expect(result?.other).toBe("value");
	expect(result?.just_blob).toBeInstanceOf(Uint8Array);
});

test("selectAll() with alias on table should work", async () => {
	const db = await mockDatabase();

	await db
		.insertInto("mock_table")
		.values({
			metadata: new TextEncoder().encode(JSON.stringify({ a: 1 })),
			other: "value",
			just_blob: new TextEncoder().encode("{mock blob value that's not a json"),
		})
		.execute();

	const result = await db
		.selectFrom("mock_table as mt")
		.selectAll("mt")
		.executeTakeFirst();

	expect(result?.metadata).toStrictEqual({ a: 1 });
	expect(result?.other).toBe("value");
	expect(result?.just_blob).toBeInstanceOf(Uint8Array);
});

test("selectAll() with joins should succeed as long as no aliases are used", async () => {
	const db = await mockDatabase();

	const insert = await db
		.insertInto("mock_table")
		.values({
			metadata: new TextEncoder().encode(JSON.stringify({ a: 1 })),
			other: "value",
			just_blob: new TextEncoder().encode("{mock blob value that's not a json"),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	await db
		.insertInto("other_table")
		.values({
			mock_table_id: insert.id,
			content: new TextEncoder().encode(JSON.stringify({ a: 1 })),
		})
		.execute();

	const result = await db
		.selectFrom("mock_table")
		.innerJoin("other_table", "mock_table.id", "other_table.mock_table_id")
		.selectAll("mock_table")
		.executeTakeFirst();

	expect(result?.metadata).toStrictEqual({ a: 1 });
	expect(result?.other).toBe("value");
	expect(result?.just_blob).toBeInstanceOf(Uint8Array);
});

const mockDatabase = async () => {
	const database = await createInMemoryDatabase({ readOnly: false });

	const db = new Kysely<{
		mock_table: {
			id: Generated<number>;
			metadata: Record<string, any>;
			other: string;
			just_blob: Uint8Array;
		};
		other_table: {
			mock_table_id: number;
			content: Record<string, any>;
		};
	}>({
		dialect: createDialect({
			database,
		}),
		plugins: [
			await ParseJsonBPluginV1({
				mock_table: ["metadata"],
				other_table: ["content"],
			}),
		],
	});

	await sql`
		CREATE TABLE mock_table (
	    id INTEGER PRIMARY KEY AUTOINCREMENT,
			metadata BLOB,
			other TEXT,
			just_blob BLOB
		) strict;

		CREATE TABLE other_table (
		  mock_table_id INTEGER,
			content BLOB,

			FOREIGN KEY (mock_table_id) REFERENCES mock_table (id)
		) strict;
	`.execute(db);

	return db;
};
