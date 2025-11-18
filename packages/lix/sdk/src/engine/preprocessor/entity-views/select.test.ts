import { describe, expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { createPreprocessor } from "../create-preprocessor.js";
import type { LixSchemaDefinition } from "../../../schema-definition/definition.js";

describe("entity view select rewrite", () => {
	test("rewrites base view selects to derive from entity state", async () => {
		const lix = await openLix({});

		const schema = {
			"x-lix-key": "unit_test_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			properties: {
				id: { type: "string" },
				label: { type: "string" },
			},
			additionalProperties: false,
		} as const;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const preprocess = createPreprocessor({ engine: lix.engine! });
		const result = preprocess({
			sql: "SELECT label FROM unit_test_schema",
			parameters: [],
		});

		expect(result.sql).toContain("schema_key = 'unit_test_schema'");
		expect(result.sql).not.toMatch(/FROM\\s+unit_test_schema(?!_)/i);

		await lix.close();
	});

	test("pushes down literal lixcol overrides", async () => {
		const lix = await openLix({});
		const schema: LixSchemaDefinition = {
			"x-lix-key": "file_override_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			"x-lix-override-lixcols": {
				lixcol_file_id: '"inlang"',
				lixcol_plugin_key: '"inlang_sdk"',
				lixcol_version_id: '"global"',
				lixcol_inherited_from_version_id: '"root"',
				lixcol_untracked: "1",
				lixcol_metadata: "null",
			},
			type: "object",
			properties: { id: { type: "string" } },
			required: ["id"],
			additionalProperties: false,
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const preprocess = createPreprocessor({ engine: lix.engine! });
		const result = preprocess({
			sql: "SELECT id FROM file_override_schema",
			parameters: [],
		});

		expect(result.sql).toMatch(/"?file_id"?\s*=\s*'inlang'/i);
		expect(result.sql).toMatch(/"?plugin_key"?\s*=\s*'inlang_sdk'/i);
		expect(result.sql).toMatch(/"?inherited_from_version_id"?\s*=\s*'root'/i);
		expect(result.sql).toMatch(/"?untracked"?\s*=\s*1/);
		expect(result.sql).toMatch(/"?metadata"?\s+is\s+null/i);

		const byVersion = preprocess({
			sql: "SELECT * FROM file_override_schema_by_version",
			parameters: [],
		});
		expect(byVersion.sql).not.toMatch(/"?version_id"?\s*=\s*'global'/i);

		await lix.close();
	});

	test("supports prefixless aliases for lix_* schemas", async () => {
		const lix = await openLix({});
		const schema = {
			"x-lix-key": "lix_alias_test",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			properties: {
				id: { type: "string" },
				label: { type: "string" },
			},
			additionalProperties: false,
		} as const;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const preprocess = createPreprocessor({ engine: lix.engine! });
		const result = preprocess({
			sql: "SELECT label FROM alias_test",
			parameters: [],
		});

		expect(result.sql).toContain("schema_key = 'lix_alias_test'");

		await lix.close();
	});

	test("rewrites _by_version and _history variants", async () => {
		const lix = await openLix({});
		const schema = {
			"x-lix-key": "variant_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			properties: {
				id: { type: "string" },
				label: { type: "string" },
			},
			additionalProperties: false,
		} as const;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();
		const preprocess = createPreprocessor({ engine: lix.engine! });

		const byVersion = preprocess({
			sql: "SELECT lixcol_version_id FROM variant_schema_by_version",
			parameters: [],
		});
		expect(byVersion.sql.toLowerCase()).toContain(
			"schema_key = 'variant_schema'"
		);

		const history = preprocess({
			sql: "SELECT lixcol_schema_version FROM variant_schema_history",
			parameters: [],
		});
		expect(history.sql.toLowerCase()).toContain(
			"schema_key = 'variant_schema'"
		);

		await lix.close();
	});

	test("respects x-lix-entity-views overrides for disabled variants", async () => {
		const lix = await openLix({});
		const schema = {
			"x-lix-key": "limited_views_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			"x-lix-entity-views": ["state"],
			type: "object",
			properties: { id: { type: "string" } },
			additionalProperties: false,
		} as const;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();
		const preprocess = createPreprocessor({ engine: lix.engine! });

		const history = preprocess({
			sql: "SELECT * FROM limited_views_schema_history",
			parameters: [],
		});

		expect(history.sql).toContain("FROM limited_views_schema_history");

		await lix.close();
	});

	test("selecting from stored schema view returns rows via preprocessor", async () => {
		const lix = await openLix({});

		const schema = {
			"x-lix-key": "e2e_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			properties: {
				id: { type: "string" },
				name: { type: "string" },
			},
			required: ["id"],
			additionalProperties: false,
		} as const;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const preprocess = createPreprocessor({ engine: lix.engine! });

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("state_by_version")
			.values({
				entity_id: "row-1",
				schema_key: "e2e_schema",
				file_id: "lix",
				version_id: activeVersion.version_id,
				plugin_key: "lix_sdk",
				snapshot_content: { id: "row-1", name: "Entity 1" },
				schema_version: "1.0",
				metadata: null,
				untracked: false,
			})
			.execute();

		const selectResult = preprocess({
			sql: "SELECT name FROM e2e_schema WHERE id = ?",
			parameters: ["row-1"],
		});

		expect(selectResult.sql).toContain("schema_key = 'e2e_schema'");

		const executed = lix.engine!.sqlite.exec({
			sql: selectResult.sql,
			bind: selectResult.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});

		expect(executed).toEqual([{ name: "Entity 1" }]);

		await lix.close();
	});
	test("filters on metadata columns remain in the parent WHERE clause", async () => {
		const lix = await openLix({});
		const schema: LixSchemaDefinition = {
			"x-lix-key": "regression_meta",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			additionalProperties: false,
			properties: { id: { type: "string" }, note: { type: "string" } },
			required: ["id"],
		};

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const preprocess = createPreprocessor({ engine: lix.engine! });
		const result = preprocess({
			sql: "SELECT * FROM regression_meta WHERE lixcol_created_at > ?",
			parameters: ["2024-01-01"],
		});

		expect(result.sql).toMatch(/\blixcol_created_at\s*>\s*\?/);

		await lix.close();
	});

	test("base view exposes inherited version id", async () => {
		const lix = await openLix({});

		const schemaKey = "inherited_version_schema";
		const schema = {
			"x-lix-key": schemaKey,
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			properties: {
				id: { type: "string" },
				name: { type: "string" },
			},
			required: ["id"],
			additionalProperties: false,
		} as const;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const entityId = "entity-1";

		await lix.db
			.insertInto("state_by_version")
			.values({
				entity_id: entityId,
				schema_key: schemaKey,
				file_id: "lix",
				version_id: "global",
				plugin_key: "lix_sdk",
				schema_version: "1.0",
				snapshot_content: { id: entityId, name: "Entity" },
				metadata: null,
				untracked: false,
			})
			.execute();

		const preprocess = createPreprocessor({ engine: lix.engine! });
		const rewritten = preprocess({
			sql: "SELECT lixcol_inherited_from_version_id FROM inherited_version_schema WHERE id = ?",
			parameters: [entityId],
		});

		const rows = lix.engine!.sqlite.exec({
			sql: rewritten.sql,
			bind: rewritten.parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});

		expect(rows).toEqual([{ lixcol_inherited_from_version_id: "global" }]);

		await lix.close();
	});

	test("rewrites only when stored schema exists", async () => {
		const lix = await openLix({});
		const sql = "SELECT name FROM transient_schema WHERE id = ?";

		expect(() =>
			lix.engine!.executeSync({ sql, parameters: ["row-1"] })
		).toThrow(/no such table/i);

		const schema = {
			"x-lix-key": "transient_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			properties: {
				id: { type: "string" },
				name: { type: "string" },
			},
			required: ["id"],
			additionalProperties: false,
		} as const;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("state_by_version")
			.values({
				entity_id: "row-1",
				schema_key: "transient_schema",
				file_id: "lix",
				version_id: activeVersion.version_id,
				plugin_key: "lix_sdk",
				snapshot_content: { id: "row-1", name: "Entity 1" },
				schema_version: "1.0",
				metadata: null,
				untracked: false,
			})
			.execute();

		const rowsPresent = lix.engine!.executeSync({
			sql,
			parameters: ["row-1"],
		}).rows;
		expect(rowsPresent).toEqual([{ name: "Entity 1" }]);

		await lix.close();
	});
});
