import { expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createQueryPreprocessor } from "../create-query-preprocessor.js";

const INSERTABLE_SCHEMA = {
	"x-lix-key": "insertable_schema",
	"x-lix-version": "1.0",
	"x-lix-primary-key": ["id"],
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
	try {
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
	} finally {
		await lix.close();
	}
});

test("rewrites inserts for _all view", async () => {
	const lix = await openLix({});
	try {
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
	} finally {
		await lix.close();
	}
});

test("uses stored schema key when inserting via prefixless alias", async () => {
	const lix = await openLix({});
	try {
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
	} finally {
		await lix.close();
	}
});

test("does not rewrite history view inserts", async () => {
	const lix = await openLix({});
	try {
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
	} finally {
		await lix.close();
	}
});

test("applies JSON defaults when column is omitted", async () => {
	const lix = await openLix({});
	const schemaWithDefaults = {
		"x-lix-key": "mock_default_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id"],
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

	try {
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
	} finally {
		await lix.close();
	}
});

test("applies function defaults when column is omitted", async () => {
	const lix = await openLix({});
	const schemaWithFnDefault = {
		"x-lix-key": "mock_fn_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id"],
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

	try {
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
	} finally {
		await lix.close();
	}
});

test("function defaults override literal defaults", async () => {
	const lix = await openLix({});
	const schemaWithBoth = {
		"x-lix-key": "mock_fn_override",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["id"],
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

	try {
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
	} finally {
		await lix.close();
	}
});

test("rewrites multi-row inserts with JSON payloads", async () => {
	const lix = await openLix({});
	try {
		const schema = {
			"x-lix-key": "multi_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["id"],
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

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

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
	} finally {
		await lix.close();
	}
});
