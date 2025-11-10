import { test, expect, vi } from "vitest";
import { sql } from "kysely";
import { openLix } from "../lix/open-lix.js";
import type { LixSchemaDefinition } from "../schema-definition/definition.js";
import { getStoredSchema, getAllStoredSchemas } from "./get-stored-schema.js";
import { createVersion } from "../version/create-version.js";
import { LixStoredSchemaSchema } from "./schema-definition.js";
import { internalQueryBuilder } from "../engine/internal-query-builder.js";
import type { StateCommitChange } from "../hooks/create-hooks.js";

const ALL_STORED_SCHEMAS_SQL = internalQueryBuilder
	.selectFrom("lix_internal_state_vtable")
	.select(["snapshot_content", "updated_at"])
	.where("schema_key", "=", LixStoredSchemaSchema["x-lix-key"])
	.where("snapshot_content", "is not", null)
	.compile().sql;

const SINGLE_STORED_SCHEMA_SQL = internalQueryBuilder
	.selectFrom("lix_internal_state_vtable")
	.select(sql`json_extract(snapshot_content, '$.value')`.as("value"))
	.where("schema_key", "=", LixStoredSchemaSchema["x-lix-key"])
	.where(sql`json_extract(snapshot_content, '$.value."x-lix-key"')`, "=", "")
	.where("version_id", "=", "global")
	.where("snapshot_content", "is not", null)
	.orderBy(
		sql`json_extract(snapshot_content, '$.value."x-lix-version"')`,
		"desc"
	)
	.limit(1)
	.compile().sql;

const countCallsForSql = (
	calls: ReadonlyArray<ReadonlyArray<unknown>>,
	targetSql: string
) =>
	calls.filter(
	([args]) => (args as { sql?: string } | undefined)?.sql === targetSql
	).length;

const createStoredSchemaHookChange = (): StateCommitChange => ({
	id: "hook-change",
	entity_id: "stored-schema",
	schema_key: "lix_stored_schema",
	schema_version: "1.0",
	file_id: "lix",
	plugin_key: "lix_own_entity",
	created_at: "1970-01-01T00:00:00.000Z",
	snapshot_content: null,
	version_id: "global",
	commit_id: "stored-schema-commit",
	untracked: 0,
	metadata: null,
	writer_key: null,
});

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
		.insertInto("stored_schema_by_version")
		.values({ value: base, lixcol_version_id: "global" })
		.execute();

	await lix.db
		.insertInto("stored_schema_by_version")
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
		.insertInto("stored_schema_by_version")
		.values({ value: base, lixcol_version_id: "global" })
		.execute();

	await lix.db
		.insertInto("stored_schema_by_version")
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
			.insertInto("stored_schema_by_version")
			.values({ value: schema, lixcol_version_id: "global" })
			.execute();
	}

	const spy = vi.spyOn(lix.engine!, "executeSync");

	const first = getAllStoredSchemas({ engine: lix.engine! });
	expect(first.definitions.has("schema_one")).toBe(true);
	expect(first.definitions.has("schema_two")).toBe(true);

	const afterFirst = countCallsForSql(spy.mock.calls, ALL_STORED_SCHEMAS_SQL);

	const second = getAllStoredSchemas({ engine: lix.engine! });
	expect(second.definitions.has("schema_one")).toBe(true);
	expect(second.definitions.has("schema_two")).toBe(true);
	expect(countCallsForSql(spy.mock.calls, ALL_STORED_SCHEMAS_SQL)).toBe(
		afterFirst
	);

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
		.insertInto("stored_schema_by_version")
		.values({ value: schema, lixcol_version_id: "global" })
		.execute();

	const spy = vi.spyOn(lix.engine!, "executeSync");

	const initial = getAllStoredSchemas({ engine: lix.engine! });
	expect(initial.definitions.has("invalidate_all_schema")).toBe(true);

	const expectedPerFetch = countCallsForSql(
		spy.mock.calls,
		ALL_STORED_SCHEMAS_SQL
	);

	spy.mockClear();

	lix.engine!.hooks._emit("state_commit", {
		changes: [createStoredSchemaHookChange()],
	});

	const afterInvalidate = getAllStoredSchemas({ engine: lix.engine! });
	expect(afterInvalidate.definitions.has("invalidate_all_schema")).toBe(true);
	expect(countCallsForSql(spy.mock.calls, ALL_STORED_SCHEMAS_SQL)).toBe(
		expectedPerFetch
	);

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
		.insertInto("stored_schema_by_version")
		.values({ value: schema, lixcol_version_id: "global" })
		.execute();

	const spy = vi.spyOn(lix.engine!, "executeSync");

	getAllStoredSchemas({ engine: lix.engine! });
	const callsAfterAllAll = countCallsForSql(
		spy.mock.calls,
		ALL_STORED_SCHEMAS_SQL
	);
	const callsAfterAllSingle = countCallsForSql(
		spy.mock.calls,
		SINGLE_STORED_SCHEMA_SQL
	);

	const single = getStoredSchema({
		engine: lix.engine!,
		key: "primed_schema",
	});
	expect(single?.["x-lix-key"]).toBe("primed_schema");
	expect(countCallsForSql(spy.mock.calls, ALL_STORED_SCHEMAS_SQL)).toBe(
		callsAfterAllAll
	);
	expect(countCallsForSql(spy.mock.calls, SINGLE_STORED_SCHEMA_SQL)).toBe(
		callsAfterAllSingle
	);

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
		.insertInto("stored_schema_by_version")
		.values({ value: schema, lixcol_version_id: "global" })
		.execute();

	const spy = vi.spyOn(lix.engine!, "executeSync");

	const first = getStoredSchema({
		engine: lix.engine!,
		key: "cached_schema",
	});
	expect(first?.["x-lix-version"]).toBe("1.0");

	const afterFirst = countCallsForSql(spy.mock.calls, SINGLE_STORED_SCHEMA_SQL);

	const second = getStoredSchema({
		engine: lix.engine!,
		key: "cached_schema",
	});
	expect(second?.["x-lix-version"]).toBe("1.0");
	expect(countCallsForSql(spy.mock.calls, SINGLE_STORED_SCHEMA_SQL)).toBe(
		afterFirst
	);

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
		.insertInto("stored_schema_by_version")
		.values({ value: schema, lixcol_version_id: "global" })
		.execute();

	const spy = vi.spyOn(lix.engine!, "executeSync");

	const initial = getStoredSchema({
		engine: lix.engine!,
		key: "cache_invalidate_schema",
	});
	expect(initial?.["x-lix-version"]).toBe("1.0");

	const perFetch = countCallsForSql(spy.mock.calls, SINGLE_STORED_SCHEMA_SQL);

	spy.mockClear();

	lix.engine!.hooks._emit("state_commit", {
		changes: [createStoredSchemaHookChange()],
	});

	const afterInvalidate = getStoredSchema({
		engine: lix.engine!,
		key: "cache_invalidate_schema",
	});
	expect(afterInvalidate?.["x-lix-version"]).toBe("1.0");
	expect(countCallsForSql(spy.mock.calls, SINGLE_STORED_SCHEMA_SQL)).toBe(
		perFetch
	);

	spy.mockRestore();
});
