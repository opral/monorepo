import { Kysely, sql, type Generated } from "kysely";
import { expect, test } from "vitest";
import { createDialect, createInMemoryDatabase } from "sqlite-wasm-kysely";
import { JSONColumnPlugin } from "./json-column-plugin.js";

test("properly serializes string values for any-json columns", async () => {
	const db = await mockDatabase();

	// Insert with a string that looks like JSON
	const jsonLikeString = '{"id":"test_id","name":"test_name","value":123}';

	await db
		.insertInto("mock_table")
		.values({
			data: jsonLikeString,
			other: "value",
		})
		.execute();

	// Verify the data was stored as a JSON string (since column accepts any JSON type)
	const result = await sql<{ stored_data: string }>`
		SELECT json(data) as stored_data FROM mock_table
	`.execute(db);

	// The stored data should be the string as a JSON string
	expect(result.rows[0]?.stored_data).toBe(JSON.stringify(jsonLikeString));

	// Verify it can be parsed correctly
	const parsed = JSON.parse(result.rows[0]?.stored_data as string);
	expect(parsed).toBe(jsonLikeString);
});

test("correctly serializes JavaScript objects", async () => {
	const db = await mockDatabase();

	// Insert with a JavaScript object
	const jsObject = { id: "test_id", name: "test_name", value: 123 };

	await db
		.insertInto("mock_table")
		.values({
			data: jsObject,
			other: "value",
		})
		.execute();

	// Verify the data was serialized and stored correctly
	const result = await sql<{ stored_data: string }>`
		SELECT json(data) as stored_data FROM mock_table
	`.execute(db);

	// The stored data should be the serialized object
	const parsed = JSON.parse(result.rows[0]?.stored_data as string);
	expect(parsed).toEqual(jsObject);
});

test("handles null values correctly", async () => {
	const db = await mockDatabase();

	await db
		.insertInto("mock_table")
		.values({
			data: null,
			other: "value",
		})
		.execute();

	const result = await sql<{ data: any }>`
		SELECT data FROM mock_table
	`.execute(db);

	expect(result.rows[0]?.data).toBe(null);
});

test("handles updates with string values", async () => {
	const db = await mockDatabase();

	// First insert some data
	await db
		.insertInto("mock_table")
		.values({
			data: { initial: "data" },
			other: "value",
		})
		.execute();

	// Update with a string that looks like JSON
	const jsonLikeString = '{"updated":"value","count":42}';

	await db.updateTable("mock_table").set({ data: jsonLikeString }).execute();

	// Verify the update properly serialized the string
	const result = await sql<{ stored_data: string }>`
		SELECT json(data) as stored_data FROM mock_table
	`.execute(db);

	expect(result.rows[0]?.stored_data).toBe(JSON.stringify(jsonLikeString));
});

test("object-only columns prevent double serialization", async () => {
	const database = await createInMemoryDatabase({ readOnly: false });

	const db = new Kysely<{
		mock_table: {
			id: Generated<number>;
			object_only: Record<string, any> | null;
			any_json: any;
		};
	}>({
		dialect: createDialect({ database }),
		plugins: [
			JSONColumnPlugin({
				mock_table: {
					object_only: { type: "object" },
					any_json: {
						type: ["string", "number", "boolean", "object", "array", "null"],
					},
				},
			}),
		],
	});

	await sql`
		CREATE TABLE mock_table (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			object_only TEXT,
			any_json TEXT
		) strict;
	`.execute(db);

	// For object-only columns, pre-serialized JSON strings should not be double-serialized
	const preSerializedObject = '{"id":"test","value":123}';

	await db
		.insertInto("mock_table")
		.values({
			// @ts-expect-error - dynamic types
			object_only: preSerializedObject,
			any_json: "plain string",
		})
		.execute();

	const result = await sql<{ object_only_data: string; any_json_data: string }>`
		SELECT json(object_only) as object_only_data, json(any_json) as any_json_data FROM mock_table
	`.execute(db);

	// object_only should not be double-serialized
	expect(result.rows[0]?.object_only_data).toBe(preSerializedObject);
	expect(JSON.parse(result.rows[0]?.object_only_data as string)).toEqual({
		id: "test",
		value: 123,
	});

	// any_json should be properly serialized as a JSON string
	expect(result.rows[0]?.any_json_data).toBe('"plain string"');
});

test("handles onConflict with string values", async () => {
	const db = await mockDatabase();

	// Insert initial data
	await db
		.insertInto("mock_table")
		.values({
			id: 1,
			data: { initial: "data" },
			other: "value",
		})
		.execute();

	// Try to insert with same id, using onConflict with a string
	const jsonLikeString = '{"conflict":"resolved","value":999}';

	await db
		.insertInto("mock_table")
		.values({
			id: 1,
			data: { should: "not_be_used" },
			other: "value",
		})
		.onConflict((oc) => oc.doUpdateSet({ data: jsonLikeString }))
		.execute();

	// Verify the conflict update properly serialized the string
	const result = await sql<{ stored_data: string }>`
		SELECT json(data) as stored_data FROM mock_table WHERE id = 1
	`.execute(db);

	expect(result.rows[0]?.stored_data).toBe(JSON.stringify(jsonLikeString));
});

const mockDatabase = async () => {
	const database = await createInMemoryDatabase({ readOnly: false });

	const db = new Kysely<{
		mock_table: {
			id: Generated<number>;
			data: Record<string, any> | string | null;
			other: string;
		};
	}>({
		dialect: createDialect({
			database,
		}),
		plugins: [
			JSONColumnPlugin({
				mock_table: {
					data: {
						type: ["string", "number", "boolean", "object", "array", "null"],
					},
				},
			}),
		],
	});

	await sql`
		CREATE TABLE mock_table (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			data TEXT,
			other TEXT
		) strict;
	`.execute(db);

	return db;
};

test("SQL expressions in JSON columns should not be wrapped in json()", async () => {
	const db = await mockDatabase();

	// Insert initial data
	await db
		.insertInto("mock_table")
		.values({
			data: {
				enabled: true,
				settings: {
					theme: "dark",
					language: "en",
				},
			},
			other: "value",
		})
		.execute();

	// Try to update using json_set SQL expression
	const updateQuery = db
		.updateTable("mock_table")
		.set({
			data: sql`json_set(data, '$.settings.theme', 'light')`,
		})
		.where("other", "=", "value")
		.compile();

	// The SQL should contain json_set directly, not wrapped in json()
	// Currently this fails - it produces: update "mock_table" set "data" = json(?) where "other" = ?
	// We want: update "mock_table" set "data" = json_set(data, '$.settings.theme', 'light') where "other" = ?
	expect(updateQuery.sql).toContain("json_set");
	expect(updateQuery.sql).not.toContain("json(?)");

	// Execute the update
	await db
		.updateTable("mock_table")
		.set({
			data: sql`json_set(data, '$.settings.theme', 'light')`,
		})
		.where("other", "=", "value")
		.execute();

	// Verify the update worked correctly
	const result = await db
		.selectFrom("mock_table")
		.select("data")
		.executeTakeFirst();

	expect(result?.data).toMatchObject({
		enabled: true,
		settings: {
			theme: "light", // Changed from "dark"
			language: "en",
		},
	});
});

test("Multiple SQL expressions in JSON columns", async () => {
	const db = await mockDatabase();

	// Insert initial data
	await db
		.insertInto("mock_table")
		.values({
			data: {
				count: 10,
				active: true,
				nested: {
					value: 100,
				},
			},
			other: "test",
		})
		.execute();

	// Update multiple properties using json_set
	const updateQuery = db
		.updateTable("mock_table")
		.set({
			data: sql`json_set(data, '$.count', 20, '$.active', false, '$.nested.value', 200)`,
		})
		.compile();

	// Should not wrap the SQL expression
	expect(updateQuery.sql).toContain("json_set");
	expect(updateQuery.sql).not.toContain("json(?)");

	await db
		.updateTable("mock_table")
		.set({
			data: sql`json_set(data, '$.count', 20, '$.active', false, '$.nested.value', 200)`,
		})
		.execute();

	const result = await db
		.selectFrom("mock_table")
		.select("data")
		.executeTakeFirst();

	expect(result?.data).toMatchObject({
		count: 20,
		active: 0, // SQLite stores false as 0
		nested: {
			value: 200,
		},
	});
});

test("SQL expressions in onConflict updates", async () => {
	const db = await mockDatabase();

	// Insert initial data
	await db
		.insertInto("mock_table")
		.values({
			id: 1,
			data: {
				version: 1,
				name: "original",
				metadata: {
					updated: false,
				},
			},
			other: "test",
		})
		.execute();

	// Try to insert with same id, using onConflict with SQL expression
	const insertQuery = db
		.insertInto("mock_table")
		.values({
			id: 1,
			data: { version: 2, name: "ignored" },
			other: "test",
		})
		.onConflict((oc) =>
			oc.doUpdateSet({
				data: sql`json_set(data, '$.version', 2, '$.metadata.updated', true)`,
			})
		)
		.compile();

	// The INSERT values will be wrapped in json(?), but the UPDATE should use json_set
	expect(insertQuery.sql).toContain("json_set");
	expect(insertQuery.sql).toContain("on conflict do update set");
	// Verify json_set is in the UPDATE part, not wrapped in json()
	expect(insertQuery.sql).toMatch(/do update set.*json_set.*\$\.version/);

	// Execute the insert with conflict
	await db
		.insertInto("mock_table")
		.values({
			id: 1,
			data: { version: 2, name: "ignored" },
			other: "test",
		})
		.onConflict((oc) =>
			oc.doUpdateSet({
				data: sql`json_set(data, '$.version', 2, '$.metadata.updated', true)`,
			})
		)
		.execute();

	// Verify the conflict update worked
	const result = await db
		.selectFrom("mock_table")
		.where("id", "=", 1)
		.select("data")
		.executeTakeFirst();

	expect(result?.data).toMatchObject({
		version: 2, // Updated
		name: "original", // Kept original
		metadata: {
			updated: 1, // SQLite stores true as 1
		},
	});
});
