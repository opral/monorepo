import { expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createQueryPreprocessor } from "../create-query-preprocessor.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";

test("rewrites inserts for stored schema views", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "insertable_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createQueryPreprocessor(lix.engine!);
	const table = schema["x-lix-key"];

	const rewritten = preprocess({
		sql: `INSERT INTO ${table} (id, name) VALUES (?, ?)`,
		parameters: ["row-1", "Entity 1"],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	expect(rewritten.parameters).toEqual(["row-1", "Entity 1"]);

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters,
	});

	const selectResult = preprocess({
		sql: `SELECT name FROM ${table} WHERE id = ?`,
		parameters: ["row-1"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
	}).rows;

	expect(rows).toEqual([
		{
			name: "Entity 1",
		},
	]);
	await lix.close();
});

test("rewrites inserts for _all view", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "insertable_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createQueryPreprocessor(lix.engine!);
	const table = schema["x-lix-key"];
	const allView = `${table}_all`;

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	const rewritten = preprocess({
		sql: `INSERT INTO ${allView} (id, name, lixcol_version_id) VALUES (?, ?, ?)`,
		parameters: ["row-2", "Entity 2", activeVersion.version_id],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	expect(rewritten.parameters).toEqual([
		"row-2",
		"Entity 2",
		activeVersion.version_id,
	]);

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters,
	});

	const selectResult = preprocess({
		sql: `SELECT name FROM ${allView} WHERE id = ? AND lixcol_version_id = ?`,
		parameters: ["row-2", activeVersion.version_id],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
	}).rows;

	expect(rows).toEqual([
		{
			name: "Entity 2",
		},
	]);
	await lix.close();
});

test("skips rewriting for disabled state_all view", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "limited_insert_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-entity-views": ["state"] as (
			| "state"
			| "state_all"
			| "state_history"
		)[],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createQueryPreprocessor(lix.engine!);
	const sql =
		"INSERT INTO limited_insert_schema_all (id, name, lixcol_version_id) VALUES (?, ?, ?)";
	const parameters = ["row-limited", "Disabled", "v1"];
	const rewritten = preprocess({ sql, parameters });

	expect(rewritten.sql).toBe(sql);
	expect(rewritten.parameters).toEqual(parameters);

	await lix.close();
});

test("missing lixcol_version_id for _all view throws", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "insertable_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createQueryPreprocessor(lix.engine!);
	const allView = `${schema["x-lix-key"]}_all`;

	expect(() =>
		preprocess({
			sql: `INSERT INTO ${allView} (id, name) VALUES (?, ?)`,
			parameters: ["row-3", "Entity 3"],
		})
	).toThrow(/lixcol_version_id/);

	await lix.close();
});

test("defaults version for _all view when schema defines lixcol_version_id", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "insertable_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
			lixcol_version_id: '"global"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();
	const preprocess = createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO insertable_schema_all (id, name) VALUES (?, ?)",
		parameters: ["acc-1", "Defaulted"],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	expect(rewritten.sql).toContain("'global'");
	expect(rewritten.parameters).toEqual(["acc-1", "Defaulted"]);

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters,
	});

	const rows = await lix.db
		.selectFrom("state_all")
		.select(["version_id", "schema_key", "entity_id"] as const)
		.where("schema_key", "=", "insertable_schema")
		.where("entity_id", "=", "acc-1")
		.execute();

	expect(rows.some((row) => row.version_id === "global")).toBe(true);
	await lix.close();
});

test("base-only views apply metadata version defaults", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "insertable_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
			lixcol_version_id: '"global"',
		},
		"x-lix-entity-views": ["state"],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} as const;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();
	const preprocess = createQueryPreprocessor(lix.engine!);
	const table = schema["x-lix-key"];

	const rewritten = preprocess({
		sql: `INSERT INTO ${table} (id, name) VALUES (?, ?)`,
		parameters: ["base-1", "Base Entity"],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	expect(rewritten.sql).toContain("'global'");
	expect(rewritten.parameters).toEqual(["base-1", "Base Entity"]);

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters,
	});

	const row = await lix.db
		.selectFrom("state_all")
		.select([
			"entity_id",
			"version_id",
			"schema_key",
			"snapshot_content",
		] as const)
		.where("schema_key", "=", table)
		.where("entity_id", "=", "base-1")
		.executeTakeFirstOrThrow();

	expect(typeof row.version_id).toBe("string");
	expect(row.snapshot_content).toEqual({
		id: "base-1",
		name: "Base Entity",
	});
	await lix.close();
});

test("rewrites inserts for composite primary key entity views", async () => {
	const lix = await openLix({});
	const compositeSchema = {
		"x-lix-key": "mock_composite_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/category", "/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			category: { type: "string" },
			id: { type: "string" },
			payload: { type: "string" },
		},
		required: ["category", "id", "payload"],
		additionalProperties: false,
	} as const;

	await lix.db
		.insertInto("stored_schema")
		.values({ value: compositeSchema })
		.execute();

	const preprocess = createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO mock_composite_schema (category, id, payload) VALUES (?, ?, ?)",
		parameters: ["catA", "idB", "example"],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	expect(rewritten.sql).toMatch(/\(\?\d+\s*\|\|\s*'~'\s*\|\|\s*\?\d+\)/);

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters,
	});

	const stateRows = await lix.db
		.selectFrom("state_all")
		.select(["entity_id", "schema_key", "snapshot_content"])
		.where("schema_key", "=", "mock_composite_schema")
		.execute();

	expect(stateRows).toEqual([
		{
			entity_id: "catA~idB",
			schema_key: "mock_composite_schema",
			snapshot_content: {
				category: "catA",
				id: "idB",
				payload: "example",
			},
		},
	]);

	const selectResult = preprocess({
		sql: "SELECT payload FROM mock_composite_schema WHERE category = ? AND id = ?",
		parameters: ["catA", "idB"],
	});

	const viewRows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
	}).rows;

	expect(viewRows).toEqual([{ payload: "example" }]);

	expect(rewritten.parameters.slice(0, 2)).toEqual(["catA", "idB"]);
	await lix.close();
});

test("stored_schema insert uses pointer primary key components", async () => {
	const lix = await openLix({});
	const preprocess = createQueryPreprocessor(lix.engine!);

	const schema = {
		"x-lix-key": "pointer_insert_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} as const;

	const rewrite = preprocess({
		sql: "INSERT INTO stored_schema (value) VALUES (?)",
		parameters: [JSON.stringify(schema)],
	});

	expect(rewrite?.sql).toMatch(/INSERT INTO state_all/);

	lix.engine!.executeSync({
		sql: rewrite!.sql,
		parameters: rewrite!.parameters,
	});

	const inserted = await lix.db
		.selectFrom("state_all")
		.select(["entity_id", "schema_key", "snapshot_content"])
		.where("schema_key", "=", "lix_stored_schema")
		.where(
			"entity_id",
			"=",
			`${schema["x-lix-key"]}~${schema["x-lix-version"]}`
		)
		.executeTakeFirst();

	expect(inserted?.entity_id).toBe(
		`${schema["x-lix-key"]}~${schema["x-lix-version"]}`
	);
	expect(inserted?.snapshot_content).toEqual({ value: schema });

	await lix.close();
});

test("pointer primary key schema uses pointer components for entity id", async () => {
	const lix = await openLix({});

	const pointerSchema = {
		"x-lix-key": "pointer_entity_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/payload/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			payload: {
				type: "object",
				properties: {
					id: { type: "string" },
					value: { type: "string" },
				},
				required: ["id", "value"],
				additionalProperties: false,
			},
		},
		required: ["payload"],
		additionalProperties: false,
	} as const;

	await lix.db
		.insertInto("stored_schema")
		.values({ value: pointerSchema })
		.execute();

	const preprocess = createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO pointer_entity_schema (payload) VALUES (?)",
		parameters: [JSON.stringify({ id: "nested-id", value: "payload-value" })],
	});

	expect(rewritten?.sql).toContain("INSERT INTO state_all");

	lix.engine!.executeSync({
		sql: rewritten!.sql,
		parameters: rewritten!.parameters,
	});

	const stateRow = await lix.db
		.selectFrom("state_all")
		.select(["entity_id", "snapshot_content"])
		.where("schema_key", "=", "pointer_entity_schema")
		.executeTakeFirstOrThrow();

	expect(stateRow.entity_id).toBe("nested-id");
	expect(stateRow.snapshot_content).toEqual({
		payload: { id: "nested-id", value: "payload-value" },
	});

	await lix.close();
});

test("preserves SQL expression parameters during insert rewrite", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "expression_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createQueryPreprocessor(lix.engine!);
	const rewritten = preprocess({
		sql: `INSERT INTO expression_schema (id, name, lixcol_version_id) VALUES (?, ?, (SELECT version_id FROM active_version))`,
		parameters: ["exp-1", "Expression"],
	});

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters,
	});

	const rows = await lix.db
		.selectFrom("expression_schema" as any)
		.select(["id", "name"])
		.where("id", "=", "exp-1")
		.execute();

	expect(rows).toEqual([{ id: "exp-1", name: "Expression" }]);
	expect(rewritten.sql.trim().startsWith("WITH")).toBe(true);
	expect(rewritten.sql).toContain("SELECT version_id FROM (");
	expect(rewritten.sql).not.toMatch(/\bFROM\s+active_version\b/i);
	expect(rewritten.expandedSql).toBeDefined();
	expect(rewritten.expandedSql).not.toMatch(/\bFROM\s+active_version\b/i);

	await lix.close();
});

test("uses stored schema key when inserting via prefixless alias", async () => {
	const lix = await openLix({});
	const preprocess = createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO key_value (key, value) VALUES (?, ?)",
		parameters: ["alias", JSON.stringify({ foo: "bar" })],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	expect(rewritten.sql).toContain("lix_key_value");
	expect(rewritten.parameters).toEqual(["alias", '{"foo":"bar"}']);

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters,
	});

	const selectResult = preprocess({
		sql: "SELECT value FROM key_value WHERE key = ?",
		parameters: ["alias"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
	}).rows;

	expect(rows).toHaveLength(1);
	const parsed = (() => {
		const raw = rows[0]?.value;
		if (typeof raw === "string") {
			return JSON.parse(raw);
		}
		return raw;
	})();
	expect(parsed).toEqual({ foo: "bar" });
	await lix.close();
});

test("does not rewrite history view inserts", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "history_insert_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		required: ["id"],
		additionalProperties: false,
	} satisfies LixSchemaDefinition;
	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createQueryPreprocessor(lix.engine!);
	const historyView = `${schema["x-lix-key"]}_history`;

	const originalSql = `INSERT INTO ${historyView} (id, name) VALUES (?, ?)`;
	const rewritten = preprocess({
		sql: originalSql,
		parameters: ["row-3", "Entity 3"],
	});

	expect(rewritten.sql).toBe(originalSql);
	expect(rewritten.parameters).toEqual(["row-3", "Entity 3"]);
	await lix.close();
});

test("applies JSON defaults when column is omitted", async () => {
	const schemaWithDefaults = {
		"x-lix-key": "mock_default_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			status: { type: "string", default: "pending" },
		},
		required: ["id"],
		additionalProperties: false,
	} as const;

	const lix = await openLix({});
	await lix.db
		.insertInto("stored_schema")
		.values({ value: schemaWithDefaults })
		.execute();

	const preprocess = createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO mock_default_schema (id) VALUES (?)",
		parameters: ["row-default"],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters,
	});

	const select = await lix.db
		// @ts-expect-error- dynamic schema
		.selectFrom("mock_default_schema")
		// @ts-expect-error - dynamic schema
		.where("id", "=", "row-default")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(select.status).toBe("pending");
	await lix.close();
});

test("applies function defaults when column is omitted", async () => {
	const schemaWithFnDefault = {
		"x-lix-key": "mock_fn_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			token: {
				type: "string",
				"x-lix-default": "lix_uuid_v7()",
			},
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const;

	const lix = await openLix({});
	await lix.db
		.insertInto("stored_schema")
		.values({ value: schemaWithFnDefault })
		.execute();

	await (lix.db as any)
		.insertInto("mock_fn_schema")
		.values({ id: "row-fn", name: "Function default" })
		.execute();

	const row = await (lix.db as any)
		.selectFrom("mock_fn_schema")
		.where("id", "=", "row-fn")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(row.token).toBeDefined();
	expect(typeof row.token).toBe("string");
	expect((row.token as string).length).toBeGreaterThan(0);
	await lix.close();
});

test("applies CEL defaults when column is omitted", async () => {
	const schemaWithCelDefault = {
		"x-lix-key": "mock_cel_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			slug: {
				type: "string",
				"x-lix-default": "name + '-slug'",
			},
			token: {
				type: "string",
				"x-lix-default": "lix_uuid_v7()",
			},
		},
		required: ["id", "name"],
		additionalProperties: false,
	} as const;

	const lix = await openLix({});
	await lix.db
		.insertInto("stored_schema")
		.values({ value: schemaWithCelDefault })
		.execute();

	const preprocess = createQueryPreprocessor(lix.engine!);

	const insert = preprocess({
		sql: "INSERT INTO mock_cel_schema (id, name) VALUES (?, ?)",
		parameters: ["row-cel", "Sample"],
	});

	lix.engine!.executeSync({
		sql: insert.sql,
		parameters: insert.parameters,
	});

	const select = preprocess({
		sql: "SELECT slug, token FROM mock_cel_schema WHERE id = ?",
		parameters: ["row-cel"],
	});

	const row = lix.engine!.executeSync({
		sql: select.sql,
		parameters: select.parameters,
	}).rows[0] as Record<string, unknown>;

	expect(row.slug).toBe("Sample-slug");
	expect(typeof row.token).toBe("string");
	expect((row.token as string).length).toBeGreaterThan(0);
	await lix.close();
});

test("function defaults override literal defaults", async () => {
	const schemaWithBoth = {
		"x-lix-key": "mock_fn_override",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			stamp: {
				type: "string",
				default: "literal",
				"x-lix-default": "lix_timestamp()",
			},
		},
		required: ["id"],
		additionalProperties: false,
	} as const;

	const lix = await openLix({});
	await lix.db
		.insertInto("stored_schema")
		.values({ value: schemaWithBoth })
		.execute();

	await (lix.db as any)
		.insertInto("mock_fn_override")
		.values({ id: "row-override" })
		.execute();

	const row = await (lix.db as any)
		.selectFrom("mock_fn_override")
		.where("id", "=", "row-override")
		.selectAll()
		.executeTakeFirstOrThrow();

	expect(row.stamp).not.toBe("literal");
	expect(typeof row.stamp).toBe("string");
	await lix.close();
});

test("rewrites multi-row inserts with JSON payloads", async () => {
	const lix = await openLix({});
	const schema = {
		"x-lix-key": "multi_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-override-lixcols": {
			lixcol_file_id: '"lix"',
			lixcol_plugin_key: '"lix_own_entity"',
		},
		type: "object",
		properties: {
			id: { type: "string" },
			payload: { type: "object" },
		},
		required: ["id", "payload"],
		additionalProperties: false,
	} as const;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const preprocess = createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO multi_schema (id, payload) VALUES (?, ?), (?, ?), (?, ?)",
		parameters: [
			"row-1",
			JSON.stringify({ foo: "bar" }),
			"row-2",
			JSON.stringify({ items: ["foo", "bar"] }),
			"row-3",
			JSON.stringify({ nested: { value: "primitive" } }),
		],
	});

	expect(rewritten.sql).toContain("VALUES (");
	expect(rewritten.sql).toContain("), (");
	expect(rewritten.sql).toContain("multi_schema");
	expect(rewritten.parameters).toContain("row-1");
	expect(rewritten.parameters).toContain("row-3");
	expect(rewritten.parameters).toContain('{"foo":"bar"}');
	expect(rewritten.parameters).toContain('{"items":["foo","bar"]}');
	expect(rewritten.parameters).toContain('{"nested":{"value":"primitive"}}');

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters,
	});

	const selectResult = preprocess({
		sql: "SELECT id, payload FROM multi_schema_all WHERE id IN (?, ?, ?)",
		parameters: ["row-1", "row-2", "row-3"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters,
	}).rows;

	expect(rows).toEqual([
		{ id: "row-1", payload: '{"foo":"bar"}' },
		{ id: "row-2", payload: '{"items":["foo","bar"]}' },
		{ id: "row-3", payload: '{"nested":{"value":"primitive"}}' },
	]);

	const stateRows = await lix.db
		.selectFrom("state_all")
		.select(["snapshot_content"] as const)
		.where("schema_key", "=", "multi_schema")
		.orderBy("entity_id")
		.execute();

	expect(stateRows.map((row) => row.snapshot_content)).toEqual([
		{ id: "row-1", payload: { foo: "bar" } },
		{ id: "row-2", payload: { items: ["foo", "bar"] } },
		{ id: "row-3", payload: { nested: { value: "primitive" } } },
	]);
	await lix.close();
});
