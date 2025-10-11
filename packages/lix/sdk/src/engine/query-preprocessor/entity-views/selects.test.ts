import { describe, expect, test } from "vitest";
import { openLix } from "../../../lix/open-lix.js";
import { getEntityViewSelects } from "./selects.js";
import { createQueryPreprocessor } from "../create-query-preprocessor.js";
import { LixActiveAccountSchema } from "../../../account/schema-definition.js";

describe("entity view select synthesis", () => {
	test("bootstrap exposes built-in stored schemas", async () => {
		const lix = await openLix({});
		const result = getEntityViewSelects({ engine: lix.engine! });
		expect(result.map.size).toBeGreaterThan(0);
		expect(result.map.has("lix_key_value")).toBe(true);
		expect(result.map.has("lix_key_value_all")).toBe(true);
		expect(result.map.has("key_value")).toBe(true);
		expect(result.map.has("key_value_all")).toBe(true);
	});

	test("registers prefixless aliases for lix_* stored schemas", async () => {
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

		const { map } = getEntityViewSelects({ engine: lix.engine! });
		expect(map.has("lix_alias_test")).toBe(true);
		expect(map.has("alias_test")).toBe(true);
		expect(map.get("alias_test")).toBe(map.get("lix_alias_test"));
		expect(map.has("lix_alias_test_all")).toBe(true);
		expect(map.has("alias_test_all")).toBe(true);
		expect(map.get("alias_test_all")).toBe(map.get("lix_alias_test_all"));
		expect(map.has("alias_test_history")).toBe(true);
		expect(map.get("alias_test_history")).toBe(
			map.get("lix_alias_test_history")
		);
	});

	test("generates base, _all, and _history selects for stored schema", async () => {
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

		const { map } = getEntityViewSelects({ engine: lix.engine! });
		expect(map.has("unit_test_schema")).toBe(true);
		expect(map.has("unit_test_schema_all")).toBe(true);
		expect(map.has("unit_test_schema_history")).toBe(true);

		const base = map.get("unit_test_schema")!;
		expect(base).toContain("FROM state_all");
		expect(base).toContain("schema_key = 'unit_test_schema'");
		expect(base).toContain(
			"AND sa.version_id = (SELECT version_id FROM active_version)"
		);
		expect(base).toContain("json_extract(sa.snapshot_content, '$.id') AS id");
		expect(base).toContain(
			"json_extract(sa.snapshot_content, '$.label') AS label"
		);
		expect(base).toContain("sa.plugin_key AS lixcol_plugin_key");

		const all = map.get("unit_test_schema_all")!;
		expect(all).toContain("FROM state_all");
		expect(all).toContain("version_id AS lixcol_version_id");

		const history = map.get("unit_test_schema_history")!;
		expect(history).toContain("FROM state_history");
		expect(history).toContain("schema_version AS lixcol_schema_version");
	});

	test("respects x-lix-entity-views overrides when synthesising selects", async () => {
		const lix = await openLix({});
		const schema = {
			"x-lix-key": "limited_views_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			"x-lix-entity-views": ["state"],
			type: "object",
			properties: {
				id: { type: "string" },
			},
			additionalProperties: false,
		} as const;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const { map } = getEntityViewSelects({ engine: lix.engine! });
		expect(map.has("limited_views_schema")).toBe(true);
		expect(map.has("limited_views_schema_all")).toBe(false);
		expect(map.has("limited_views_schema_history")).toBe(false);
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

		const preprocess = await createQueryPreprocessor(lix.engine!);

		const activeVersion = await lix.db
			.selectFrom("active_version")
			.select("version_id")
			.executeTakeFirstOrThrow();

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "row-1",
				schema_key: "e2e_schema",
				file_id: "lix",
				version_id: activeVersion.version_id,
				plugin_key: "lix_own_entity",
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

		expect(selectResult.sql).not.toMatch(/FROM\s+e2e_schema\b/i);
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
			.insertInto("state_all")
			.values({
				entity_id: entityId,
				schema_key: schemaKey,
				file_id: "lix",
				version_id: "global",
				plugin_key: "lix_own_entity",
				schema_version: "1.0",
				snapshot_content: { id: entityId, name: "Entity" },
				inherited_from_version_id: "global",
				metadata: null,
				untracked: false,
			})
			.execute();

		const preprocess = await createQueryPreprocessor(lix.engine!);
		const rewritten = preprocess({
			sql: "SELECT lixcol_inherited_from_version_id FROM inherited_version_schema WHERE id = ?",
			parameters: [entityId],
		});

		expect(rewritten.sql).toContain("COALESCE");

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
	test("cached result reuses signature while queries in flight", async () => {
		const lix = await openLix({});
		const schema = {
			"x-lix-key": "cache_test_schema",
			"x-lix-version": "1.0",
			"x-lix-primary-key": ["/id"],
			type: "object",
			properties: {
				id: { type: "string" },
			},
			additionalProperties: false,
		} as const;

		await lix.db
			.insertInto("stored_schema")
			.values({ value: schema })
			.execute();

		const first = getEntityViewSelects({ engine: lix.engine! });
		const second = getEntityViewSelects({ engine: lix.engine! });

		expect(first.signature).toBe(second.signature);
		expect(first.map.get("cache_test_schema")).toBe(
			second.map.get("cache_test_schema")
		);
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
			.insertInto("state_all")
			.values({
				entity_id: "row-1",
				schema_key: "transient_schema",
				file_id: "lix",
				version_id: activeVersion.version_id,
				plugin_key: "lix_own_entity",
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
	});
});
