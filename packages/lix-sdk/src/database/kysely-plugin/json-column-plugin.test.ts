import { Kysely, sql, type Generated } from "kysely";
import { expect, test } from "vitest";
import { createDialect, createInMemoryDatabase } from "sqlite-wasm-kysely";
import { JSONColumnPlugin } from "./json-column-plugin.js";

test("does not double serialize pre-serialized JSON strings", async () => {
	const db = await mockDatabase();

	// Insert with a pre-serialized JSON string
	const preSerializedJson = '{"id":"test_id","name":"test_name","value":123}';
	
	await db
		.insertInto("mock_table")
		.values({
			data: preSerializedJson,
			other: "value",
		})
		.execute();

	// Verify the data was stored correctly without double serialization
	const result = await sql<{ stored_data: string }>`
		SELECT json(data) as stored_data FROM mock_table
	`.execute(db);

	// The stored data should be the original JSON string, not double-serialized
	expect(result.rows[0]?.stored_data).toBe(preSerializedJson);
	
	// Verify it can be parsed correctly
	const parsed = JSON.parse(result.rows[0]?.stored_data as string);
	expect(parsed).toEqual({
		id: "test_id",
		name: "test_name",
		value: 123
	});
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

test("handles updates with pre-serialized JSON", async () => {
	const db = await mockDatabase();

	// First insert some data
	await db
		.insertInto("mock_table")
		.values({
			data: { initial: "data" },
			other: "value",
		})
		.execute();

	// Update with pre-serialized JSON
	const preSerializedUpdate = '{"updated":"value","count":42}';
	
	await db
		.updateTable("mock_table")
		.set({ data: preSerializedUpdate })
		.execute();

	// Verify the update didn't double-serialize
	const result = await sql<{ stored_data: string }>`
		SELECT json(data) as stored_data FROM mock_table
	`.execute(db);

	expect(result.rows[0]?.stored_data).toBe(preSerializedUpdate);
});

test("handles onConflict with pre-serialized JSON", async () => {
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

	// Try to insert with same id, using onConflict with pre-serialized JSON
	const preSerializedConflict = '{"conflict":"resolved","value":999}';
	
	await db
		.insertInto("mock_table")
		.values({
			id: 1,
			data: { should: "not_be_used" },
			other: "value",
		})
		.onConflict((oc) => oc.doUpdateSet({ data: preSerializedConflict }))
		.execute();

	// Verify the conflict update didn't double-serialize
	const result = await sql<{ stored_data: string }>`
		SELECT json(data) as stored_data FROM mock_table WHERE id = 1
	`.execute(db);

	expect(result.rows[0]?.stored_data).toBe(preSerializedConflict);
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
				mock_table: ["data"],
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