import { expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createQueryPreprocessor } from "../create-query-preprocessor.js";

const INSERTABLE_SCHEMA = {
	"x-lix-key": "insertable_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["/id"],
	"x-lix-defaults": {
		lixcol_file_id: "lix",
		lixcol_plugin_key: "lix_own_entity",
	},
	type: "object",
	properties: {
		id: { type: "string" },
		name: { type: "string" },
	},
	required: ["id"],
	additionalProperties: false,
} as const;

test("rewrites inserts for stored schema views", async () => {
	const lix = await openLix({});
	await lix.db
		.insertInto("stored_schema")
		.values({ value: INSERTABLE_SCHEMA })
		.execute();

	const preprocess = await createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO insertable_schema (id, name) VALUES (?, ?)",
		parameters: ["row-1", "Entity 1"],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	expect(rewritten.parameters).toEqual([
		"row-1",
		"insertable_schema",
		"lix",
		"lix_own_entity",
		"row-1",
		"Entity 1",
		"1.0",
		null,
		0,
	]);

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters as any[],
	});

	const selectResult = preprocess({
		sql: "SELECT name FROM insertable_schema WHERE id = ?",
		parameters: ["row-1"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters as any[],
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
	await lix.db
		.insertInto("stored_schema")
		.values({ value: INSERTABLE_SCHEMA })
		.execute();

	const preprocess = await createQueryPreprocessor(lix.engine!);

	const activeVersion = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	const rewritten = preprocess({
		sql: "INSERT INTO insertable_schema_all (id, name, lixcol_version_id) VALUES (?, ?, ?)",
		parameters: ["row-2", "Entity 2", activeVersion.version_id],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	expect(rewritten.parameters).toEqual([
		"row-2",
		"insertable_schema",
		"lix",
		activeVersion.version_id,
		"lix_own_entity",
		"row-2",
		"Entity 2",
		"1.0",
		null,
		0,
	]);

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters as any[],
	});

	const selectResult = preprocess({
		sql: "SELECT name FROM insertable_schema_all WHERE id = ? AND lixcol_version_id = ?",
		parameters: ["row-2", activeVersion.version_id],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters as any[],
	}).rows;

	expect(rows).toEqual([
		{
			name: "Entity 2",
		},
	]);
	await lix.close();
});

test("missing lixcol_version_id for _all view throws", async () => {
	const lix = await openLix({});
	await lix.db
		.insertInto("stored_schema")
		.values({ value: INSERTABLE_SCHEMA })
		.execute();

	const preprocess = await createQueryPreprocessor(lix.engine!);

	expect(() =>
		preprocess({
			sql: "INSERT INTO insertable_schema_all (id, name) VALUES (?, ?)",
			parameters: ["row-3", "Entity 3"],
		})
	).toThrow(/lixcol_version_id/);

	await lix.close();
});

test("defaults version for _all view when schema defines lixcol_version_id", async () => {
	const lix = await openLix({});
	const preprocess = await createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO account_all (id, name) VALUES (?, ?)",
		parameters: ["acc-1", "Defaulted"],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	expect(rewritten.parameters[3]).toBe("global");

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters as any[],
	});

	const rows = await lix.db
		.selectFrom("account_all")
		.where("id", "=", "acc-1")
		.selectAll()
		.execute();

	const globalRow = rows.find((row) => row.lixcol_version_id === "global");
	expect(globalRow).toBeDefined();
	await lix.close();
});

test("rewrites inserts for composite primary key entity views", async () => {
	const lix = await openLix({});
	const compositeSchema = {
		"x-lix-key": "mock_composite_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/category", "/id"],
		"x-lix-defaults": {
			lixcol_file_id: "lix",
			lixcol_plugin_key: "lix_own_entity",
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

	const preprocess = await createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO mock_composite_schema (category, id, payload) VALUES (?, ?, ?)",
		parameters: ["catA", "idB", "example"],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	expect(rewritten.sql).toMatch(/\(\?\s*\|\|\s*'~'\s*\|\|\s*\?\)/);

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters as any[],
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
	const preprocess = await createQueryPreprocessor(lix.engine!);

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
		parameters: [schema],
	});

	expect(rewrite?.sql).toMatch(/INSERT INTO state_all/);

	lix.engine!.executeSync({
		sql: rewrite!.sql,
		parameters: rewrite!.parameters as any[],
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
		"x-lix-defaults": {
			lixcol_file_id: "lix",
			lixcol_plugin_key: "lix_own_entity",
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

	const preprocess = await createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO pointer_entity_schema (payload) VALUES (?)",
		parameters: [{ id: "nested-id", value: "payload-value" }],
	});

	expect(rewritten?.sql).toContain("INSERT INTO state_all");

	lix.engine!.executeSync({
		sql: rewritten!.sql,
		parameters: rewritten!.parameters as any[],
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
		"x-lix-defaults": {
			lixcol_file_id: "lix",
			lixcol_plugin_key: "lix_own_entity",
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

	const preprocess = await createQueryPreprocessor(lix.engine!);
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
	expect(rewritten.sql).toContain("SELECT version_id FROM active_version");

	await lix.close();
});

test("uses stored schema key when inserting via prefixless alias", async () => {
	const lix = await openLix({});
	const preprocess = await createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO key_value (key, value) VALUES (?, ?)",
		parameters: ["alias", { foo: "bar" }],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	expect(rewritten.parameters[0]).toBe("alias");
	expect(rewritten.parameters[1]).toBe("lix_key_value");

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters as any[],
	});

	const selectResult = preprocess({
		sql: "SELECT value FROM key_value WHERE key = ?",
		parameters: ["alias"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters as any[],
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
	await lix.db
		.insertInto("stored_schema")
		.values({ value: INSERTABLE_SCHEMA })
		.execute();

	const preprocess = await createQueryPreprocessor(lix.engine!);

	const originalSql =
		"INSERT INTO insertable_schema_history (id, name) VALUES (?, ?)";
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
		"x-lix-defaults": {
			lixcol_file_id: "lix",
			lixcol_plugin_key: "lix_own_entity",
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

	const preprocess = await createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO mock_default_schema (id) VALUES (?)",
		parameters: ["row-default"],
	});

	expect(rewritten.sql).toContain("INSERT INTO state_all");
	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters as any[],
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
		"x-lix-defaults": {
			lixcol_file_id: "lix",
			lixcol_plugin_key: "lix_own_entity",
		},
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
			token: {
				type: "string",
				"x-lix-default-call": { name: "lix_uuid_v7" },
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

test("function defaults override literal defaults", async () => {
	const schemaWithBoth = {
		"x-lix-key": "mock_fn_override",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		"x-lix-defaults": {
			lixcol_file_id: "lix",
			lixcol_plugin_key: "lix_own_entity",
		},
		type: "object",
		properties: {
			id: { type: "string" },
			stamp: {
				type: "string",
				default: "literal",
				"x-lix-default-call": { name: "lix_timestamp" },
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
		"x-lix-defaults": {
			lixcol_file_id: "lix",
			lixcol_plugin_key: "lix_own_entity",
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

	const preprocess = await createQueryPreprocessor(lix.engine!);

	const rewritten = preprocess({
		sql: "INSERT INTO multi_schema (id, payload) VALUES (?, ?), (?, ?), (?, ?)",
		parameters: [
			"row-1",
			{ foo: "bar" },
			"row-2",
			{ items: ["foo", "bar"] },
			"row-3",
			{ nested: { value: "primitive" } },
		],
	});

	expect(rewritten.sql).toContain("VALUES (");
	expect(rewritten.sql).toContain("), (");
	expect(rewritten.parameters).toContain("multi_schema");
	expect(rewritten.parameters).toContain("row-1");
	expect(rewritten.parameters).toContain("row-3");
	expect(rewritten.parameters).toContain('{"foo":"bar"}');
	expect(rewritten.parameters).toContain('{"items":["foo","bar"]}');
	expect(rewritten.parameters).toContain('{"nested":{"value":"primitive"}}');

	lix.engine!.executeSync({
		sql: rewritten.sql,
		parameters: rewritten.parameters as any[],
	});

	const selectResult = preprocess({
		sql: "SELECT id, payload FROM multi_schema_all WHERE id IN (?, ?, ?)",
		parameters: ["row-1", "row-2", "row-3"],
	});

	const rows = lix.engine!.executeSync({
		sql: selectResult.sql,
		parameters: selectResult.parameters as any[],
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
