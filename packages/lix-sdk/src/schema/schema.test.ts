import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { NewStoredSchema } from "./schema.js";

test("insert and delete a stored schema", async () => {
	const lix = await openLixInMemory({});

	const initial = await lix.db
		.selectFrom("stored_schema")
		.selectAll()
		.execute();

	expect(initial).toHaveLength(0);

	const schema: NewStoredSchema = {
		value: JSON.stringify({
			type: "object",
			"x-lix-key": "mock",
			"x-lix-version": "1.0",
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
			additionalProperties: false,
		}),
	};

	await lix.db.insertInto("stored_schema").values(schema).execute();

	const afterInsert = await lix.db
		.selectFrom("stored_schema")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(afterInsert).toMatchObject({
		key: "mock",
		version: "1.0",
		value: JSON.parse(schema.value),
	});

	await lix.db.deleteFrom("stored_schema").where("key", "=", "mock").execute();

	const afterDelete = await lix.db
		.selectFrom("stored_schema")
		.selectAll()
		.execute();

	expect(afterDelete).toHaveLength(0);
});

test("throws if the stored schema version does not match the x-lix-version prop", async () => {
	const lix = await openLixInMemory({});

	const schema: NewStoredSchema = {
		version: "2.0",
		value: JSON.stringify({
			type: "object",
			"x-lix-key": "mock",
			"x-lix-version": "1.0",
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
			additionalProperties: false,
		}),
	};

	await expect(
		lix.db.insertInto("stored_schema").values(schema).execute()
	).rejects.toThrow(/Inserted version does not match value\.x-lix-version/);
});

test("throws if the stored schema key does not match the x-lix-key prop", async () => {
	const lix = await openLixInMemory({});

	const schema: NewStoredSchema = {
		key: "mock",
		version: "1.0",
		value: JSON.stringify({
			type: "object",
			"x-lix-key": "mock2",
			"x-lix-version": "1.0",
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
			additionalProperties: false,
		}),
	};

	await expect(
		lix.db.insertInto("stored_schema").values(schema).execute()
	).rejects.toThrow(/Inserted key does not match value\.x-lix-key/);
});

test("updating is not possible (schema is immutable, needs new version bumb)", async () => {
	const lix = await openLixInMemory({});

	const schema: NewStoredSchema = {
		key: "mock",
		version: "1.0",
		value: JSON.stringify({
			type: "object",
			"x-lix-key": "mock",
			"x-lix-version": "1.0",
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
			additionalProperties: false,
		}),
	};

	await lix.db.insertInto("stored_schema").values(schema).execute();

	await expect(
		lix.db.updateTable("stored_schema").set({ version: "2.0" }).execute()
	).rejects.toThrow(/cannot modify stored_schema because it is a view/);
});