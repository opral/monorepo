import { test, expect } from "vitest";
import { openLixInMemory } from "../lix/open-lix-in-memory.js";
import type { NewStoredSchema } from "./schema.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";

test("insert and delete a stored schema", async () => {
	const lix = await openLixInMemory({});

	const schema: NewStoredSchema = {
		value: {
			type: "object",
			"x-lix-key": "mock",
			"x-lix-version": "1.0",
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
			additionalProperties: false,
		},
	};

	await lix.db.insertInto("stored_schema").values(schema).execute();

	const afterInsert = await lix.db
		.selectFrom("stored_schema")
		.selectAll()
		.where("key", "=", "mock")
		.where("version", "=", "1.0")
		.executeTakeFirst();

	expect(afterInsert).toMatchObject({
		key: "mock",
		version: "1.0",
		value: schema.value,
	});

	await lix.db.deleteFrom("stored_schema").where("key", "=", "mock").execute();

	const afterDelete = await lix.db
		.selectFrom("stored_schema")
		.selectAll()
		.where("key", "=", "mock")
		.where("version", "=", "1.0")
		.execute();

	expect(afterDelete).toHaveLength(0);
});

test("throws if the stored schema version does not match the x-lix-version prop", async () => {
	const lix = await openLixInMemory({});

	const schema: NewStoredSchema = {
		version: "2.0",
		key: "mock",
		value: {
			type: "object",
			"x-lix-key": "mock",
			"x-lix-version": "1.0",
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
			additionalProperties: false,
		},
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
		value: {
			type: "object",
			"x-lix-key": "mock2",
			"x-lix-version": "1.0",
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
			additionalProperties: false,
		},
	};

	await expect(
		lix.db.insertInto("stored_schema").values(schema).execute()
	).rejects.toThrow(/Inserted key does not match value\.x-lix-key/);
});

test("updating is not possible (schema is immutable, needs new version bumb)", async () => {
	const lix = await openLixInMemory({});

	const schema: NewStoredSchema = {
		value: {
			type: "object",
			"x-lix-key": "mock",
			"x-lix-version": "1.0",
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
			additionalProperties: false,
		},
	};

	await lix.db.insertInto("stored_schema").values(schema).execute();

	await expect(
		lix.db.updateTable("stored_schema").set({ version: "2.0" }).execute()
	).rejects.toThrow(
		/Schemas are immutable and cannot be updated for backwards compatibility. Bump the version number instead./
	);
});

test("default fills in key and version from the schema value", async () => {
	const lix = await openLixInMemory({});

	const schema: NewStoredSchema = {
		value: {
			"x-lix-key": "mock",
			"x-lix-version": "1.0",
			type: "object",
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
			additionalProperties: false,
		},
	};

	await lix.db.insertInto("stored_schema").values(schema).execute();

	const result = await lix.db
		.selectFrom("stored_schema")
		.selectAll()
		.where("key", "=", "mock")
		.executeTakeFirstOrThrow();

	expect(result.key).toBe("mock");
	expect(result.version).toBe("1.0");
});

test("validates inserted schemas", async () => {
	const lix = await openLixInMemory({});

	const schema: NewStoredSchema = {
		value: {
			type: "object",
			"x-lix-key": "mock",
			// @ts-expect-error - x-lix-version must be a string
			"x-lix-version": 1,
			properties: {
				name: { type: "string" },
			},
			required: ["name"],
			additionalProperties: false,
		},
	};

	await expect(
		lix.db.insertInto("stored_schema").values(schema).execute()
	).rejects.toThrow(/version must be string/);
});

test("can insert into stored_schema_all with explicit key and version", async () => {
	const lix = await openLixInMemory({});

	const schema: LixSchemaDefinition = {
		type: "object",
		"x-lix-key": "mock_all",
		"x-lix-version": "1.0",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	};

	// Insert with explicit key and version
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			key: "mock_all",
			version: "1.0",
			// @ts-expect-error - todo why does implicit json stringify not work here
			value: JSON.stringify(schema),
			lixcol_version_id: "global",
		})
		.execute();

	const result = await lix.db
		.selectFrom("stored_schema_all")
		.selectAll()
		.where("key", "=", "mock_all")
		.where("version", "=", "1.0")
		.executeTakeFirstOrThrow();

	expect(result.key).toBe("mock_all");
	expect(result.version).toBe("1.0");
	expect(result.value).toEqual(schema);
});

test("can insert into stored_schema_all with default key and version extraction", async () => {
	const lix = await openLixInMemory({});

	const schema: LixSchemaDefinition = {
		type: "object",
		"x-lix-key": "mock_extract",
		"x-lix-version": "2.0",
		properties: {
			name: { type: "string" },
		},
		required: ["name"],
		additionalProperties: false,
	};

	// Insert without key and version - should be extracted from value
	await lix.db
		.insertInto("stored_schema_all")
		.values({
			value: schema,
			lixcol_version_id: "global",
		})
		.execute();

	const result = await lix.db
		.selectFrom("stored_schema_all")
		.selectAll()
		.where("key", "=", "mock_extract")
		.where("version", "=", "2.0")
		.executeTakeFirstOrThrow();

	expect(result.key).toBe("mock_extract");
	expect(result.version).toBe("2.0");
	expect(result.value).toEqual(schema);
});
