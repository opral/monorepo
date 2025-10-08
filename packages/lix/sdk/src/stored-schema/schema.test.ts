import { test, expect } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import type { NewState } from "../entity-views/types.js";
import type { LixStoredSchema } from "./schema-definition.js";
import { sql } from "kysely";

test("insert and delete a stored schema", async () => {
	const lix = await openLix({});

	const schema: NewState<LixStoredSchema> = {
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
		.select("value")
		.where(
			sql`json_extract("stored_schema"."value", '$."x-lix-key"')`,
			"=",
			"mock"
		)
		.where(
			sql`json_extract("stored_schema"."value", '$."x-lix-version"')`,
			"=",
			"1.0"
		)
		.executeTakeFirst();

	expect(afterInsert?.value).toEqual(schema.value);

	await lix.db
		.deleteFrom("stored_schema")
		.where("lixcol_entity_id", "=", "mock~1.0")
		.execute();

	const afterDelete = await lix.db
		.selectFrom("stored_schema")
		.select("value")
		.where(
			sql`json_extract("stored_schema"."value", '$."x-lix-key"')`,
			"=",
			"mock"
		)
		.where(
			sql`json_extract("stored_schema"."value", '$."x-lix-version"')`,
			"=",
			"1.0"
		)
		.execute();

	expect(afterDelete).toHaveLength(0);
});

test("updating is not possible (schema is immutable, needs new version bumb)", async () => {
	const lix = await openLix({});

	const schema: NewState<LixStoredSchema> = {
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
		lix.db
			.updateTable("stored_schema")
			.set({
				value: {
					...(schema.value as Record<string, unknown>),
					"x-lix-version": "2.0",
				},
			})
			.execute()
	).rejects.toThrow(/immutable/);
});

test("validates inserted schemas", async () => {
	const lix = await openLix({});

	const schema: any = {
		value: {
			type: "object",
			"x-lix-key": "mock",
			// intentionally invalid version type
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
	).rejects.toThrow(/value\.x-lix-version must be string/);
});

test("can insert into stored_schema_all ", async () => {
	const lix = await openLix({});

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

	await lix.db
		.insertInto("stored_schema_all")
		.values({
			value: schema,
			lixcol_version_id: "global",
		})
		.execute();

	const result = await lix.db
		.selectFrom("stored_schema_all")
		.select("value")
		.where(
			sql`json_extract("stored_schema_all"."value", '$."x-lix-key"')`,
			"=",
			"mock_all"
		)
		.where(
			sql`json_extract("stored_schema_all"."value", '$."x-lix-version"')`,
			"=",
			"1.0"
		)
		.executeTakeFirstOrThrow();

	expect(result.value).toEqual(schema);
});

test("can insert into stored_schema_all with default key and version extraction", async () => {
	const lix = await openLix({});

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
		.select("value")
		.where(
			sql`json_extract("stored_schema_all"."value", '$."x-lix-key"')`,
			"=",
			"mock_extract"
		)
		.where(
			sql`json_extract("stored_schema_all"."value", '$."x-lix-version"')`,
			"=",
			"2.0"
		)
		.executeTakeFirstOrThrow();

	expect(result.value).toEqual(schema);
});
