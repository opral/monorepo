import { describe, expect, test } from "vitest";
import type { RootOperationNode } from "kysely";
import { openLix } from "../../../../lix/open-lix.js";
import { internalQueryBuilder } from "../../../internal-query-builder.js";
import { compile } from "../../compile.js";
import { rewriteEntityViewSelect } from "./select.js";
import type { PreprocessorTrace } from "../../types.js";

const qb = internalQueryBuilder as any;

function applyRewrite(
	node: RootOperationNode,
	overrides?: Partial<{
		storedSchemas: Map<string, unknown>;
		cacheTables: Map<string, unknown>;
		trace: PreprocessorTrace;
	}>
) {
	return rewriteEntityViewSelect({
		node,
		storedSchemas: overrides?.storedSchemas ?? new Map(),
		cacheTables: overrides?.cacheTables ?? new Map(),
		trace: overrides?.trace,
	});
}

async function collectStoredSchemas(lix: Awaited<ReturnType<typeof openLix>>) {
	const rows = await lix.db
		.selectFrom("stored_schema")
		.select(["value"])
		.execute();

	const map = new Map<string, unknown>();

	for (const row of rows) {
		const value = row.value as Record<string, any>;
		const schemaKey = value["x-lix-key"];
		if (!schemaKey) {
			continue;
		}

		map.set(schemaKey, value);

		if (schemaKey.startsWith("lix_")) {
			map.set(schemaKey.replace(/^lix_/, ""), value);
		}

		map.set(`${schemaKey}_all`, value);
		map.set(`${schemaKey}_history`, value);
	}

	return map;
}

describe("rewriteEntityViewSelect", () => {
	test("rewrites built-in stored schema view", async () => {
		const lix = await openLix({});
		const storedSchemas = await collectStoredSchemas(lix);

		const node = qb
			.selectFrom("lix_key_value as kv")
			.select(["kv.id", "kv.value"])
			.where("kv.id", "=", "counter")
			.toOperationNode() as RootOperationNode;

		const trace: PreprocessorTrace = [];
		const rewritten = applyRewrite(node, {
			storedSchemas,
			trace,
		});

		const { sql } = compile(rewritten);

		expect(sql).not.toMatch(/FROM\s+"lix_key_value"\b/i);
		expect(sql).toContain("schema_key = 'lix_key_value'");
		expect(trace[0]?.step ?? null).toBe("rewrite_entity_view_select");

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

		const storedSchemas = await collectStoredSchemas(lix);

		const node = qb
			.selectFrom("alias_test as a")
			.select(["a.id", "a.label"])
			.toOperationNode() as RootOperationNode;

		const rewritten = applyRewrite(node, {
			storedSchemas,
		});

		const { sql } = compile(rewritten);
		expect(sql).toContain("schema_key = 'lix_alias_test'");
		expect(sql).not.toMatch(/FROM\s+"alias_test"/i);

		await lix.close();
	});

	test("rewrites base, _all, and _history entity views", async () => {
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

		const storedSchemas = await collectStoredSchemas(lix);

		const baseNode = qb
			.selectFrom("unit_test_schema as u")
			.selectAll("u")
			.toOperationNode() as RootOperationNode;

		const allNode = qb
			.selectFrom("unit_test_schema_all")
			.selectAll()
			.toOperationNode() as RootOperationNode;

		const historyNode = qb
			.selectFrom("unit_test_schema_history")
			.selectAll()
			.toOperationNode() as RootOperationNode;

		const baseSql = compile(applyRewrite(baseNode, { storedSchemas })).sql;
		const allSql = compile(applyRewrite(allNode, { storedSchemas })).sql;
		const historySql = compile(
			applyRewrite(historyNode, { storedSchemas })
		).sql;

		expect(baseSql).toContain("schema_key = 'unit_test_schema'");
		expect(baseSql.toUpperCase()).toMatch(/FROM\s+"?STATE_ALL"?/);
		expect(allSql.toUpperCase()).toMatch(/FROM\s+"?STATE_ALL"?/);
		expect(allSql.toUpperCase()).toContain(
			'"SA"."VERSION_ID" AS "LIXCOL_VERSION_ID"'
		);
		expect(historySql.toUpperCase()).toMatch(/FROM\s+"?STATE_HISTORY"?/);
		expect(historySql).toContain("schema_version");

		await lix.close();
	});

	test("honours x-lix-entity-views overrides", async () => {
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

		const storedSchemas = await collectStoredSchemas(lix);

		const node = qb
			.selectFrom("limited_views_schema_all")
			.selectAll()
			.toOperationNode() as RootOperationNode;

		expect(() => applyRewrite(node, { storedSchemas })).toThrow(
			/entity view 'limited_views_schema_all'/i
		);

		await lix.close();
	});

	test("selecting from stored schema view returns rows after rewrite", async () => {
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

		const storedSchemas = await collectStoredSchemas(lix);
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

		const node = qb
			.selectFrom("e2e_schema as e")
			.select("e.name")
			.where("e.id", "=", "row-1")
			.toOperationNode() as RootOperationNode;

		const { sql, parameters } = compile(applyRewrite(node, { storedSchemas }));

		const rows = lix.engine!.sqlite.exec({
			sql,
			bind: parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});

		expect(rows).toEqual([{ name: "Entity 1" }]);

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

		const storedSchemas = await collectStoredSchemas(lix);

		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: "entity-1",
				schema_key: schemaKey,
				file_id: "lix",
				version_id: "global",
				plugin_key: "lix_own_entity",
				schema_version: "1.0",
				snapshot_content: { id: "entity-1", name: "Entity" },
				inherited_from_version_id: "global",
				metadata: null,
				untracked: false,
			})
			.execute();

		const node = qb
			.selectFrom("inherited_version_schema as s")
			.select("s.lixcol_inherited_from_version_id")
			.where("s.id", "=", "entity-1")
			.toOperationNode() as RootOperationNode;

		const { sql, parameters } = compile(applyRewrite(node, { storedSchemas }));

		const rows = lix.engine!.sqlite.exec({
			sql,
			bind: parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});

		expect(rows).toEqual([{ lixcol_inherited_from_version_id: "global" }]);

		await lix.close();
	});

	test("produces stable SQL for identical replays", async () => {
		const lix = await openLix({});
		const storedSchemas = await collectStoredSchemas(lix);

		const node = qb
			.selectFrom("lix_key_value as kv")
			.select(["kv.id", "kv.value"])
			.where("kv.id", "=", "counter")
			.toOperationNode() as RootOperationNode;

		const first = compile(applyRewrite(node, { storedSchemas }));
		const second = compile(applyRewrite(node, { storedSchemas }));

		expect(second.sql).toBe(first.sql);
		expect(second.parameters).toEqual(first.parameters);

		await lix.close();
	});

	test("rewrites only when stored schema exists", async () => {
		const lix = await openLix({});

		const node = qb
			.selectFrom("transient_schema as t")
			.select("t.name")
			.where("t.id", "=", "row-1")
			.toOperationNode() as RootOperationNode;

		expect(() => applyRewrite(node, { storedSchemas: new Map() })).toThrow(
			/transient_schema/i
		);

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

		const storedSchemas = await collectStoredSchemas(lix);

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

		const { sql, parameters } = compile(applyRewrite(node, { storedSchemas }));

		console.log(sql);

		const rows = lix.engine!.sqlite.exec({
			sql,
			bind: parameters as any[],
			returnValue: "resultRows",
			rowMode: "object",
			columnNames: [],
		});

		expect(rows).toEqual([{ name: "Entity 1" }]);

		await lix.close();
	});
});
