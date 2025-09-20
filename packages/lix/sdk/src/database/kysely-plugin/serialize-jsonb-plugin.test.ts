import { Kysely, sql, type Generated } from "kysely";
import { expect, test } from "vitest";
import { createDialect, createInMemoryDatabase } from "../sqlite-wasm/index.js";
import { SerializeJsonBPlugin } from "./serialize-jsonb-plugin.js";
import { ParseJsonBPluginV1 } from "./parse-jsonb-plugin-v1.js";

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

// JSONB serialization for updates is only supported when using the object form: .set({ col: value }).
// The string-key form .set('col', value) will not be intercepted for JSONB serialization.
//
// (took to long to get this working, should work in the future if people ask for it though.)
test.skip("works with kysely column syntax", async () => {
	const db = await mockDatabase();

	await db
		.insertInto("mock_table")
		.values({
			id: 1,
			metadata: "value1",
			other: "other",
			just_blob: new Uint8Array(),
		})
		.execute();

	// update
	await db
		.updateTable("mock_table")
		.set("metadata", "value2")
		.where("id", "=", 1)
		.execute();

	const result = await db
		.selectFrom("mock_table")
		.where("id", "=", 1)
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(result).toEqual({
		id: 1,
		metadata: "value2",
		other: "other",
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

test("null leads to a nulled column, not nulled json", async () => {
	const db = await mockDatabase();

	await db
		.insertInto("mock_table")
		.values({
			metadata: null,
			other: "value",
			just_blob: new Uint8Array(),
		})
		.executeTakeFirstOrThrow();

	const result =
		await sql`SELECT jsonb(metadata) as metadata FROM mock_table;`.execute(db);

	expect(result.rows).toEqual([{ metadata: null }]);
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
			ParseJsonBPluginV1({
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
