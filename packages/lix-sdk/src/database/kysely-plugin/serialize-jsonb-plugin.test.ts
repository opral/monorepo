import { Kysely, sql, type Generated } from "kysely";
import { expect, test } from "vitest";
import { createDialect, createInMemoryDatabase } from "sqlite-wasm-kysely";
import { SerializeJsonBPlugin } from "./serialize-jsonb-plugin.js";

test("inserts should work", async () => {
	const db = await mockDatabase();

	const result = await db
		.insertInto("mock_table")
		.values({
			metadata: { a: 1 },
			other: "value",
			just_blob: new Uint8Array(),
		})
		.returningAll()
		// no parsing json plugin is installed, hence select json from db instead
		.returning(sql`json(metadata)`.as("metadata"))
		.executeTakeFirstOrThrow();

	expect(result).toEqual({
		id: 1,
		metadata: JSON.stringify({ a: 1 }),
		other: "value",
		just_blob: new Uint8Array(),
	});
});

test("updates should work", async () => {
	const db = await mockDatabase();

	const insert = await db
		.insertInto("mock_table")
		.values({
			metadata: { a: 1 },
			other: "value",
			just_blob: new Uint8Array(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const result = await db
		.updateTable("mock_table")
		.set({ metadata: { b: 2 } })
		.where("id", "=", insert.id)
		.returningAll()
		// no parsing json plugin is installed, hence select json from db instead
		.returning(sql`json(metadata)`.as("metadata"))
		.executeTakeFirstOrThrow();

	expect(result).toEqual({
		id: 1,
		metadata: JSON.stringify({ b: 2 }),
		other: "value",
		just_blob: new Uint8Array(),
	});
});

test("onConflict should work", async () => {
	const db = await mockDatabase();

	const insert = await db
		.insertInto("mock_table")
		.values({
			metadata: { a: 1 },
			other: "value",
			just_blob: new Uint8Array(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	const result = await db
		.insertInto("mock_table")
		.values({
			id: insert.id,
			metadata: { b: 2 },
			other: "value",
			just_blob: new Uint8Array(),
		})
		.onConflict((oc) => oc.doUpdateSet({ metadata: { b: 2 } }))
		.returningAll()
		// no parsing json plugin is installed, hence select json from db instead
		.returning(sql`json(metadata)`.as("metadata"))
		.executeTakeFirstOrThrow();

	expect(result).toEqual({
		id: 1,
		metadata: JSON.stringify({ b: 2 }),
		other: "value",
		just_blob: new Uint8Array(),
	});
});

test("json number primitive works", async () => {
	const db = await mockDatabase();

	const result = await db
		.insertInto("mock_table")
		.values({
			metadata: 42,
			other: "value",
			just_blob: new Uint8Array(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(result).toEqual({
		id: 1,
		metadata: 42,
		other: "value",
		just_blob: new Uint8Array(),
	});
});

test("json string primitive works", async () => {
	const db = await mockDatabase();

	const result = await db
		.insertInto("mock_table")
		.values({
			metadata: "hello",
			other: "value",
			just_blob: new Uint8Array(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(result).toEqual({
		id: 1,
		metadata: "hello",
		other: "value",
		just_blob: new Uint8Array(),
	});
});

test("json boolean primitive works", async () => {
	const db = await mockDatabase();

	const result = await db
		.insertInto("mock_table")
		.values({
			metadata: true,
			other: "value",
			just_blob: new Uint8Array(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(result).toEqual({
		id: 1,
		metadata: true,
		other: "value",
		just_blob: new Uint8Array(),
	});
});

test("json null primitive works", async () => {
	const db = await mockDatabase();

	const result = await db
		.insertInto("mock_table")
		.values({
			metadata: null,
			other: "value",
			just_blob: new Uint8Array(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(result).toEqual({
		id: 1,
		metadata: null,
		other: "value",
		just_blob: new Uint8Array(),
	});
});

test("json array works", async () => {
	const db = await mockDatabase();

	const result = await db
		.insertInto("mock_table")
		.values({
			metadata: [1, 2, "3"],
			other: "value",
			just_blob: new Uint8Array(),
		})
		.returningAll()
		.executeTakeFirstOrThrow();

	expect(result).toEqual({
		id: 1,
		metadata: [1, 2, "3"],
		other: "value",
		just_blob: new Uint8Array(),
	});
});

const mockDatabase = async () => {
	const database = await createInMemoryDatabase({ readOnly: false });

	const db = new Kysely<{
		mock_table: {
			id: Generated<number>;
			metadata:
				| Record<string, any>
				| string
				| number
				| boolean
				| null
				| Array<any>;
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
			SerializeJsonBPlugin({
				mock_table: ["metadata"],
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
