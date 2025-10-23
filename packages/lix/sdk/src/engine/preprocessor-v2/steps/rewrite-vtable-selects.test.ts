import { expect, test } from "vitest";
import { internalQueryBuilder } from "../../internal-query-builder.js";
import {
	REWRITTEN_STATE_VTABLE,
	rewriteVtableSelects,
} from "./rewrite-vtable-selects.js";
import { sql } from "kysely";
import type { RootOperationNode, SelectQueryNode } from "kysely";
import { compile } from "../compile.js";
import { extractCteName } from "../utils.js";
import type { PreprocessorTraceEntry } from "../types.js";
import { openLix } from "../../../lix/open-lix.js";
import { insertTransactionState } from "../../../state/transaction/insert-transaction-state.js";
import { getTimestamp } from "../../functions/timestamp.js";

test("hoists to lix_internal_state_vtable_rewritten", () => {
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable")
		.selectAll()
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain("lix_internal_state_vtable_rewritten");
	expect(sql).not.toMatch(/\blix_internal_state_vtable\b/);
});

test("hoists a CTE for the rewritten vtable", () => {
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable")
		.selectAll()
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
	});

	const select = rewritten as SelectQueryNode;
	const ctes = select.with?.expressions ?? [];

	expect(ctes.length).toBeGreaterThan(0);
	const cteNames = ctes.map(extractCteName);
	expect(cteNames).toContain(REWRITTEN_STATE_VTABLE);

	const { sql } = compile(rewritten);
	const normalized = sql.trim().toUpperCase();

	expect(normalized).toMatch(/^WITH\b/);
	expect(sql).toContain("hoisted_lix_internal_state_vtable_rewrite");
	expect(sql).toContain(REWRITTEN_STATE_VTABLE);
});

test("emits trace metadata with alias and filters", () => {
	const trace: PreprocessorTraceEntry[] = [];

	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.selectAll("v")
		.where("v.schema_key", "=", "test_schema_key")
		.toOperationNode() as RootOperationNode;

	rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		trace,
	});

	expect(trace).toHaveLength(1);
	const entry = trace[0]!;
	expect(entry.step).toBe("rewrite_vtable_selects");
	const payload = entry.payload as Record<string, unknown>;
	expect(payload.aliases).toEqual(["v"]);
	expect(payload.projection).toBe("selectAll");
	expect(payload.schema_key_predicates).toBe(1);
	expect(payload.reference_count).toBe(1);
	expect(payload.schema_key_literals).toEqual(["test_schema_key"]);
	expect(payload.schema_key_has_dynamic).toBe(false);
	expect(payload.selected_columns).toBeNull();
});

test("throws on dynamic schema key filters", () => {
	const trace: PreprocessorTraceEntry[] = [];

	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.where("v.schema_key", "=", sql.raw("?") as any)
		.selectAll("v")
		.toOperationNode() as RootOperationNode;

	expect(() =>
		rewriteVtableSelects({
			node,
			storedSchemas: new Map(),
			cacheTables: new Map(),
			trace,
		})
	).toThrowError(
		"rewrite_vtable_selects requires literal schema_key predicates; received ambiguous filter."
	);
	expect(trace).toHaveLength(0);
});

test("uses projected columns when select is narrowed", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.select(["v.schema_key", "v.file_id"])
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		trace,
	});

	expect(trace).toHaveLength(1);
	const payload = trace[0]!.payload as Record<string, unknown>;
	expect(payload.selected_columns).toEqual(["schema_key", "file_id"]);

	const { sql } = compile(rewritten);
	expect(sql).toContain('"w"."schema_key" as "schema_key"');
	expect(sql).toContain('"w"."file_id" as "file_id"');
	expect(sql).not.toContain('"w"."_pk" as "_pk"');
});

test("respects aliases when projecting columns", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.select((eb) => [eb.ref("v.schema_key").as("schema_key_alias")])
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		trace,
	});

	const payload = trace[0]!.payload as Record<string, unknown>;
	expect(payload.selected_columns).toEqual(["schema_key_alias"]);

	const { sql } = compile(rewritten);
	expect(sql).toContain('"w"."schema_key" as "schema_key_alias"');
	expect(sql).not.toContain('"w"."_pk" as "_pk"');
});

test("includes _pk across segments when explicitly selected", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.where("v.schema_key", "=", "test_schema_key")
		.select(["v._pk", "v.schema_key"])
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map([["test_schema_key", "test_schema_key_cache_table"]]),
		trace,
	});

	const payload = trace[0]!.payload as Record<string, unknown>;
	expect(payload.selected_columns).toEqual(["_pk", "schema_key"]);

	const { sql } = compile(rewritten);
	expect(sql).toContain('"w"."_pk" as "_pk"');
	expect(sql).toContain('"w"."schema_key" as "schema_key"');
	expect(sql).toContain("'T' || '~' || lix_encode_pk_part");
	expect(sql).toContain("'U' || '~' || lix_encode_pk_part");
	expect(sql).toContain("'C' || '~' || lix_encode_pk_part");
});

test("retains writer joins when writer_key is selected", () => {
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.select(["v.schema_key", "v.writer_key"])
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
	});

	const { sql } = compile(rewritten);
	expect(sql).toContain("LEFT JOIN lix_internal_state_writer ws_dst");
	expect(sql).toContain("LEFT JOIN lix_internal_state_writer ws_src");
});

test("routes cache queries to mapped physical tables", () => {
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.selectAll("v")
		.where("v.schema_key", "=", "test_schema_key")
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map([["test_schema_key", "test_schema_key_cache_table"]]),
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain('FROM "test_schema_key_cache_table"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBe(2);
});

test("includes only cache tables for matching schema filters", () => {
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.selectAll("v")
		.where("v.schema_key", "=", "test_schema_key")
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map([
			["test_schema_key", "test_schema_key_cache_table"],
			["test_schema_key_other", "test_schema_key_other_cache_table"],
		]),
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain('FROM "test_schema_key_cache_table"');
	expect(sql).not.toContain('FROM "test_schema_key_other_cache_table"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBe(2);
});

test("unions cache tables when multiple schema filters are present", () => {
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.where((eb) =>
			eb.or([
				eb("v.schema_key", "=", "test_schema_key"),
				eb("v.schema_key", "=", "test_schema_key_other"),
			])
		)
		.selectAll("v")
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map([
			["test_schema_key", "test_schema_key_cache_table"],
			["test_schema_key_other", "test_schema_key_other_cache_table"],
			["test_schema_key_unused", "test_schema_key_unused_cache_table"],
		]),
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain('FROM "test_schema_key_cache_table"');
	expect(sql).toContain('FROM "test_schema_key_other_cache_table"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBe(3);
	expect(sql).not.toContain("test_schema_key_unused_cache_table");
});

test("skips cache unions when no cache tables mapped", () => {
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.selectAll("v")
		.where("v.schema_key", "=", "test_schema_key")
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
	});

	const { sql } = compile(rewritten);

	expect(sql).not.toContain('FROM "test_schema_key_cache_table"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBe(1);
	expect(sql).not.toContain("cache.is_tombstone");
});

test("unions all available cache tables when no schema filter is provided", () => {
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.selectAll("v")
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map([
			["test_schema_key_one", "cache_table_one"],
			["test_schema_key_two", "cache_table_two"],
		]),
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain('FROM "cache_table_one"');
	expect(sql).toContain('FROM "cache_table_two"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBeGreaterThanOrEqual(3);
});

test("handles multiple vtable references with selective projections", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as a")
		.innerJoin("lix_internal_state_vtable as b", (join) =>
			join.onRef("a.schema_key", "=", "b.schema_key")
		)
		.select(["a.schema_key", "a.file_id", "b.writer_key"])
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		trace,
	});

	expect(trace[0]!.payload).toMatchObject({
		aliases: ["a", "b"],
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain(
		'select "a"."schema_key", "a"."file_id", "b"."writer_key"'
	);
	expect(sql).toContain("c.entity_id AS entity_id");
	expect(sql).toContain("c.version_id AS version_id");
	expect(sql).toContain("c.change_id AS change_id");
	expect(sql).toContain("LEFT JOIN lix_internal_state_writer ws_dst");
	expect(sql).toContain("LEFT JOIN lix_internal_state_writer ws_src");
});

test("returns transaction rows", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	const timestamp = await getTimestamp({ lix });
	insertTransactionState({
		engine: lix.engine!,
		data: [
			{
				entity_id: "entity_txn",
				schema_key: "test_schema_key",
				file_id: "file_txn",
				plugin_key: "test_plugin",
				snapshot_content: JSON.stringify({ foo: "bar" }),
				schema_version: "1",
				version_id: "global",
				untracked: false,
			},
		],
		timestamp,
	});

	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.selectAll("v")
		.where("v.schema_key", "=", "test_schema_key")
		.toOperationNode() as RootOperationNode;

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
	});

	const { sql: rewrittenSql, parameters } = compile(rewritten);
	const rows = lix.engine!.sqlite.exec({
		sql: rewrittenSql,
		bind: parameters as any[],
		returnValue: "resultRows",
		rowMode: "object",
	});

	expect(rows).toEqual([
		expect.objectContaining({
			entity_id: "entity_txn",
			schema_key: "test_schema_key",
			file_id: "file_txn",
		}),
	]);
});
