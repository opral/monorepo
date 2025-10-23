import { expect, test } from "vitest";
import { internalQueryBuilder } from "../internal-query-builder.js";
import { preprocessRootOperationNode } from "./preprocess-root-operation-node.js";
import { openLix } from "../../lix/index.js";
import { type RootOperationNode } from "kysely";
import { compile } from "./compile.js";
import type { PreprocessorTrace } from "./types.js";

async function collectStoredSchemas(lix: Awaited<ReturnType<typeof openLix>>) {
	const rows = await lix.db
		.selectFrom("stored_schema")
		.select("value")
		.execute();

	const map = new Map<string, unknown>();
	for (const row of rows) {
		const value = row.value as Record<string, any>;
		const schemaKey = value["x-lix-key"];
		if (typeof schemaKey !== "string" || schemaKey.length === 0) {
			continue;
		}
		map.set(schemaKey, value);
		if (schemaKey.startsWith("lix_")) {
			const alias = schemaKey.slice(4);
			if (alias.length > 0) {
				map.set(alias, value);
				map.set(`${alias}_all`, value);
				map.set(`${alias}_history`, value);
			}
		}
		map.set(`${schemaKey}_all`, value);
		map.set(`${schemaKey}_history`, value);
	}
	return map;
}

test("accepts internal state vtable queries", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const query = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable")
		.selectAll("lix_internal_state_vtable");

	const node = query.toOperationNode() as RootOperationNode;

	const compiled = compile(preprocessRootOperationNode(node));

	const result = lix.engine?.sqlite.exec({
		sql: compiled.sql,
		bind: compiled.parameters as any[],
		returnValue: "resultRows",
		rowMode: "object",
	});

	expect(result).toBeDefined();
});

test("entity view rewrite flows through state and vtable pipeline", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const schema = {
		"x-lix-key": "pipeline_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		additionalProperties: false,
	} as const;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const storedSchemas = await collectStoredSchemas(lix);
	const trace: PreprocessorTrace = [];

	const qb = internalQueryBuilder as any;
	const node = qb
		.selectFrom("pipeline_schema as ps")
		.selectAll("ps")
		.where("ps.id", "=", "row-1")
		.toOperationNode() as RootOperationNode;

	const rewritten = preprocessRootOperationNode(node, {
		storedSchemas,
		cacheTables: new Map(),
		trace,
	});

	const compiled = compile(rewritten);
	const upper = compiled.sql.toUpperCase();

	expect(upper).not.toMatch(/FROM\s+"?PIPELINE_SCHEMA"?/);
	expect(upper).not.toMatch(/FROM\s+"?STATE"?/);
	expect(upper).not.toMatch(/FROM\s+"?STATE_ALL"?/);
	expect(upper).toContain("LIX_INTERNAL_STATE_VTABLE_REWRITTEN");
	expect(trace.map((entry) => entry.step)).toEqual([
		"rewrite_entity_view_select",
		"rewrite_state_view_select",
		"rewrite_state_all_view_select",
		"rewrite_vtable_selects",
	]);

	const rows = lix.engine?.sqlite.exec({
		sql: compiled.sql,
		bind: compiled.parameters as any[],
		returnValue: "resultRows",
		rowMode: "object",
	});

	expect(rows).toBeDefined();

	await lix.close();
});

test("rewrites join between two entity views", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const schema = {
		"x-lix-key": "pipeline_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		additionalProperties: false,
	} as const;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const storedSchemas = await collectStoredSchemas(lix);
	const trace: PreprocessorTrace = [];

	const qb = internalQueryBuilder as any;
	const node = qb
		.selectFrom("pipeline_schema as current")
		.innerJoin("pipeline_schema_all as snapshot", (join: any) =>
			join.onRef("current.lixcol_entity_id", "=", "snapshot.lixcol_entity_id")
		)
		.select(["current.id", "snapshot.lixcol_version_id"])
		.toOperationNode() as RootOperationNode;

	const rewritten = preprocessRootOperationNode(node, {
		storedSchemas,
		cacheTables: new Map(),
		trace,
	});

	const compiled = compile(rewritten);
	const upper = compiled.sql.toUpperCase();

	expect(upper).not.toMatch(/FROM\s+"?PIPELINE_SCHEMA"?/);
	expect(upper).not.toMatch(/FROM\s+"?PIPELINE_SCHEMA_ALL"?/);
	expect(upper).not.toMatch(/FROM\s+"?STATE"?(\s|$)/);
	expect(upper).toContain("LIX_INTERNAL_STATE_VTABLE_REWRITTEN");

	const entityTrace = trace.find(
		(entry) => entry.step === "rewrite_entity_view_select"
	);
	expect(entityTrace).toBeDefined();
	const entityPayload = entityTrace?.payload as
		| Array<{ view: string; alias: string | null }>
		| undefined;
	if (entityPayload) {
		expect(entityPayload).toEqual(
			expect.arrayContaining([
				expect.objectContaining({
					view: "pipeline_schema",
					alias: "current",
				}),
				expect.objectContaining({
					view: "pipeline_schema_all",
					alias: "snapshot",
				}),
			])
		);
	}
	expect(entityTrace?.payload).toHaveLength(2);
	expect(trace.map((entry) => entry.step)).toEqual([
		"rewrite_entity_view_select",
		"rewrite_state_view_select",
		"rewrite_state_all_view_select",
		"rewrite_vtable_selects",
	]);

	const rows = lix.engine?.sqlite.exec({
		sql: compiled.sql,
		bind: compiled.parameters as any[],
		returnValue: "resultRows",
		rowMode: "object",
	});

	expect(rows).toBeDefined();

	await lix.close();
});

test("rewrites join mixing entity and raw state views", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const schema = {
		"x-lix-key": "pipeline_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		additionalProperties: false,
	} as const;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const storedSchemas = await collectStoredSchemas(lix);
	const trace: PreprocessorTrace = [];

	const qb = internalQueryBuilder as any;
	const node = qb
		.selectFrom("pipeline_schema as ps")
		.innerJoin("lix_internal_state_vtable as v", (join: any) =>
			join
				.onRef("ps.lixcol_entity_id", "=", "v.entity_id")
				.onRef("ps.lixcol_schema_key", "=", "v.schema_key")
		)
		.select(["ps.id", "ps.lixcol_schema_key", "v.snapshot_content"])
		.toOperationNode() as RootOperationNode;

	const rewritten = preprocessRootOperationNode(node, {
		storedSchemas,
		cacheTables: new Map(),
		trace,
	});

	const compiled = compile(rewritten);
	const upper = compiled.sql.toUpperCase();

	expect(upper).not.toMatch(/FROM\s+"?PIPELINE_SCHEMA"?/);
	expect(upper).not.toMatch(/FROM\s+"?STATE"?(\s|$)/);
	const rewrittenMatches =
		upper.match(/LIX_INTERNAL_STATE_VTABLE_REWRITTEN/g) ?? [];
	expect(rewrittenMatches.length).toBeGreaterThanOrEqual(2);
	expect(upper).not.toContain('"LIX_INTERNAL_STATE_VTABLE"');

	const entityTrace = trace.find(
		(entry) => entry.step === "rewrite_entity_view_select"
	);
	expect(entityTrace).toBeDefined();
	expect(entityTrace?.payload).toEqual(
		expect.arrayContaining([expect.objectContaining({ alias: "ps" })])
	);

	const vtableTrace = trace.find(
		(entry) => entry.step === "rewrite_vtable_selects"
	);
	expect(vtableTrace).toBeDefined();
	const vtablePayload = vtableTrace?.payload as
		| { aliases?: string[]; reference_count?: number }
		| undefined;
	expect(vtablePayload?.aliases).toEqual(expect.arrayContaining(["v"]));
	expect(vtablePayload?.reference_count ?? 0).toBeGreaterThanOrEqual(1);
	expect(trace.map((entry) => entry.step)).toEqual([
		"rewrite_entity_view_select",
		"rewrite_state_view_select",
		"rewrite_state_all_view_select",
		"rewrite_vtable_selects",
	]);

	await lix.close();
});

test("rewrites nested subquery with entity view references", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const schema = {
		"x-lix-key": "pipeline_schema",
		"x-lix-version": "1.0",
		"x-lix-primary-key": ["/id"],
		type: "object",
		properties: {
			id: { type: "string" },
			name: { type: "string" },
		},
		additionalProperties: false,
	} as const;

	await lix.db.insertInto("stored_schema").values({ value: schema }).execute();

	const storedSchemas = await collectStoredSchemas(lix);
	const trace: PreprocessorTrace = [];

	const qb = internalQueryBuilder as any;
	const source = qb
		.selectFrom("pipeline_schema as inner_ps")
		.select(["inner_ps.id", "inner_ps.lixcol_schema_key"])
		.where("inner_ps.id", "=", "row-1")
		.as("source");

	const node = qb
		.selectFrom(source)
		.select(["source.id", "source.lixcol_schema_key"])
		.toOperationNode() as RootOperationNode;

	const rewritten = preprocessRootOperationNode(node, {
		storedSchemas,
		cacheTables: new Map(),
		trace,
	});

	const compiled = compile(rewritten);
	const upper = compiled.sql.toUpperCase();

	expect(upper).toContain("LIX_INTERNAL_STATE_VTABLE_REWRITTEN");
	expect(upper).not.toMatch(/FROM\s+"?PIPELINE_SCHEMA"?/);
	expect(upper).not.toMatch(/FROM\s+"?PIPELINE_SCHEMA_ALL"?/);
	expect(upper).not.toContain('"LIX_INTERNAL_STATE_VTABLE"');

	const entityTrace = trace.find(
		(entry) => entry.step === "rewrite_entity_view_select"
	);
	expect(entityTrace).toBeDefined();

	const vtableTrace = trace.find(
		(entry) => entry.step === "rewrite_vtable_selects"
	);
	expect(vtableTrace).toBeDefined();

	const rows = lix.engine?.sqlite.exec({
		sql: compiled.sql,
		bind: compiled.parameters as any[],
		returnValue: "resultRows",
		rowMode: "object",
	});

	expect(rows).toBeDefined();

	await lix.close();
});
