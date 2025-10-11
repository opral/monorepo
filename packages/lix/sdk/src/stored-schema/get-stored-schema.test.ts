import { test, expect, vi } from "vitest";
import { openLix } from "../lix/open-lix.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { getStoredSchema, getAllStoredSchemas } from "./get-stored-schema.js";
import { createVersion } from "../version/create-version.js";

test("returns null when no stored schema is found", async () => {
	const lix = await openLix({});

	const schema = getStoredSchema({ engine: lix.engine!, key: "missing" });
	expect(schema).toBeNull();
});

test("returns the latest stored schema version for a key", async () => {
	const lix = await openLix({});

	const base: LixSchemaDefinition = {
		type: "object",
		"x-lix-key": "test_schema",
		"x-lix-version": "1.0",
		properties: { id: { type: "string" } },
		required: ["id"],
		additionalProperties: false,
	};

	await lix.db
		.insertInto("stored_schema_all")
		.values({ value: base, lixcol_version_id: "global" })
		.execute();

	await lix.db
		.insertInto("stored_schema_all")
		.values({
			value: { ...base, "x-lix-version": "2.0" },
			lixcol_version_id: "global",
		})
		.execute();

	const schema = getStoredSchema({
		engine: lix.engine!,
		key: "test_schema",
	});

	expect(schema).not.toBeNull();
	expect(schema?.["x-lix-version"]).toBe("2.0");
});

test("ignores schemas outside the global version", async () => {
	const lix = await openLix({});

	const featureVersion = await createVersion({
		lix,
		id: "feature",
		name: "Feature",
	});

	const base: LixSchemaDefinition = {
		type: "object",
		"x-lix-key": "global_only_schema",
		"x-lix-version": "1.0",
		properties: { id: { type: "string" } },
		required: ["id"],
		additionalProperties: false,
	};

	await lix.db
		.insertInto("stored_schema_all")
		.values({ value: base, lixcol_version_id: "global" })
		.execute();

	await lix.db
		.insertInto("stored_schema_all")
		.values({
			value: { ...base, "x-lix-version": "3.0" },
			lixcol_version_id: featureVersion.id,
		})
		.execute();

	const schema = getStoredSchema({
		engine: lix.engine!,
		key: "global_only_schema",
	});

	expect(schema).not.toBeNull();
	expect(schema?.["x-lix-version"]).toBe("1.0");
});

test("getAllStoredSchemas returns all definitions and caches the result", async () => {
	const lix = await openLix({});

	const schemas: LixSchemaDefinition[] = [
		{
			type: "object",
			"x-lix-key": "schema_one",
			"x-lix-version": "1.0",
			properties: { id: { type: "string" } },
			required: ["id"],
			additionalProperties: false,
		},
		{
			type: "object",
			"x-lix-key": "schema_two",
			"x-lix-version": "1.0",
			properties: { id: { type: "string" } },
			required: ["id"],
			additionalProperties: false,
		},
	];

	for (const schema of schemas) {
		await lix.db
			.insertInto("stored_schema_all")
			.values({ value: schema, lixcol_version_id: "global" })
			.execute();
	}

	const spy = vi.spyOn(lix.engine!, "executeSync");

	const first = getAllStoredSchemas({ engine: lix.engine! });
	const keys = new Set(
		first.schemas.map((entry) => entry.definition["x-lix-key"])
	);
	expect(keys.has("schema_one")).toBe(true);
	expect(keys.has("schema_two")).toBe(true);

	const afterFirst = spy.mock.calls.length;

	const second = getAllStoredSchemas({ engine: lix.engine! });
	const secondKeys = new Set(
		second.schemas.map((entry) => entry.definition["x-lix-key"])
	);
	expect(secondKeys.has("schema_one")).toBe(true);
	expect(secondKeys.has("schema_two")).toBe(true);
	expect(spy.mock.calls.length).toBe(afterFirst);

	spy.mockRestore();
});

test("getAllStoredSchemas invalidates cache on state commit", async () => {
	const lix = await openLix({});

	const schema: LixSchemaDefinition = {
		type: "object",
		"x-lix-key": "invalidate_all_schema",
		"x-lix-version": "1.0",
		properties: { id: { type: "string" } },
		required: ["id"],
		additionalProperties: false,
	};

	await lix.db
		.insertInto("stored_schema_all")
		.values({ value: schema, lixcol_version_id: "global" })
		.execute();

	const spy = vi.spyOn(lix.engine!, "executeSync");

	const initial = getAllStoredSchemas({ engine: lix.engine! });
	const hasSchema = initial.schemas.some(
		(entry) => entry.definition["x-lix-key"] === "invalidate_all_schema"
	);
	expect(hasSchema).toBe(true);

	spy.mockClear();

	lix.engine!.hooks._emit("state_commit", {
		changes: [{ schema_key: "lix_stored_schema" }],
	});

	const afterInvalidate = getAllStoredSchemas({ engine: lix.engine! });
	const stillHasSchema = afterInvalidate.schemas.some(
		(entry) => entry.definition["x-lix-key"] === "invalidate_all_schema"
	);
	expect(stillHasSchema).toBe(true);
	expect(spy.mock.calls.length).toBe(1);

	spy.mockRestore();
});

test("getAllStoredSchemas primes getStoredSchema cache", async () => {
	const lix = await openLix({});

	const schema: LixSchemaDefinition = {
		type: "object",
		"x-lix-key": "primed_schema",
		"x-lix-version": "1.0",
		properties: { id: { type: "string" } },
		required: ["id"],
		additionalProperties: false,
	};

	await lix.db
		.insertInto("stored_schema_all")
		.values({ value: schema, lixcol_version_id: "global" })
		.execute();

	const spy = vi.spyOn(lix.engine!, "executeSync");

	getAllStoredSchemas({ engine: lix.engine! });
	const callsAfterAll = spy.mock.calls.length;

	const single = getStoredSchema({
		engine: lix.engine!,
		key: "primed_schema",
	});
	expect(single?.["x-lix-key"]).toBe("primed_schema");
	expect(spy.mock.calls.length).toBe(callsAfterAll);

	spy.mockRestore();
});

test("caches lookups for identical keys", async () => {
	const lix = await openLix({});

	const schema: LixSchemaDefinition = {
		type: "object",
		"x-lix-key": "cached_schema",
		"x-lix-version": "1.0",
		properties: { id: { type: "string" } },
		required: ["id"],
		additionalProperties: false,
	};

	await lix.db
		.insertInto("stored_schema_all")
		.values({ value: schema, lixcol_version_id: "global" })
		.execute();

	const spy = vi.spyOn(lix.engine!, "executeSync");

	const first = getStoredSchema({
		engine: lix.engine!,
		key: "cached_schema",
	});
	expect(first?.["x-lix-version"]).toBe("1.0");

	const afterFirst = spy.mock.calls.length;

	const second = getStoredSchema({
		engine: lix.engine!,
		key: "cached_schema",
	});
	expect(second?.["x-lix-version"]).toBe("1.0");
	expect(spy.mock.calls.length).toBe(afterFirst);

	spy.mockRestore();
});

test("invalidates the cache when stored schemas change", async () => {
	const lix = await openLix({});

	const schema: LixSchemaDefinition = {
		type: "object",
		"x-lix-key": "cache_invalidate_schema",
		"x-lix-version": "1.0",
		properties: { id: { type: "string" } },
		required: ["id"],
		additionalProperties: false,
	};

	await lix.db
		.insertInto("stored_schema_all")
		.values({ value: schema, lixcol_version_id: "global" })
		.execute();

	const spy = vi.spyOn(lix.engine!, "executeSync");

	const initial = getStoredSchema({
		engine: lix.engine!,
		key: "cache_invalidate_schema",
	});
	expect(initial?.["x-lix-version"]).toBe("1.0");

	spy.mockClear();

	lix.engine!.hooks._emit("state_commit", {
		changes: [{ schema_key: "lix_stored_schema" }],
	});

	const afterInvalidate = getStoredSchema({
		engine: lix.engine!,
		key: "cache_invalidate_schema",
	});
	expect(afterInvalidate?.["x-lix-version"]).toBe("1.0");
	expect(spy.mock.calls.length).toBe(1);

	spy.mockRestore();
});
