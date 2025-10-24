import { expect, test } from "vitest";
import { parse } from "../sql-parser/parser.js";
import { toRootOperationNode } from "../sql-parser/to-root-operation-node.js";
import {
	REWRITTEN_STATE_VTABLE,
	rewriteVtableSelects,
} from "./rewrite-vtable-selects.js";
import { compile } from "../compile.js";
import type { PreprocessorTraceEntry } from "../types.js";
import { openLix } from "../../../lix/open-lix.js";
import { insertTransactionState } from "../../../state/transaction/insert-transaction-state.js";
import { getTimestamp } from "../../functions/timestamp.js";

test("rewrites to inline lix_internal_state_vtable_rewritten subquery", () => {
	const node = toRootOperationNode(
		parse(`
			SELECT * FROM lix_internal_state_vtable
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		hasOpenTransaction: true,
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain("lix_internal_state_vtable_rewritten");
	expect(sql).toMatch(/FROM\s+\(/i);
	expect(sql).not.toMatch(/\blix_internal_state_vtable\b/);
});

test("does not rewrite non-SELECT statements", () => {
	const node = toRootOperationNode(
		parse(`
			UPDATE lix_internal_state_vtable
			SET schema_key = 'test'
		`)
	);

	const original = compile(node);
	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		hasOpenTransaction: true,
	});

	const { sql } = compile(rewritten);

	expect(sql).toBe(original.sql);
	expect(sql).not.toContain(REWRITTEN_STATE_VTABLE);
});

test("does not rely on hoisted CTEs", () => {
	const node = toRootOperationNode(
		parse(`
			SELECT *
			FROM lix_internal_state_vtable
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		hasOpenTransaction: true,
	});

	const { sql } = compile(rewritten);
	const normalized = sql.trim().toUpperCase();

	expect(normalized.startsWith("WITH")).toBe(false);
	expect(sql).toContain(REWRITTEN_STATE_VTABLE);
	expect(sql).toMatch(/FROM\s+\(/i);
});

test("emits trace metadata with alias and filters", () => {
	const trace: PreprocessorTraceEntry[] = [];

	const node = toRootOperationNode(
		parse(`
			SELECT v.*
			FROM lix_internal_state_vtable AS v
			WHERE v.schema_key = 'test_schema_key'
		`)
	);

	rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		trace,
		hasOpenTransaction: true,
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

	const node = toRootOperationNode(
		parse(`
			SELECT v.*
			FROM lix_internal_state_vtable AS v
			WHERE v.schema_key = ?
		`)
	);

	expect(() =>
		rewriteVtableSelects({
			node,
			storedSchemas: new Map(),
			cacheTables: new Map(),
			trace,
			hasOpenTransaction: true,
		})
	).toThrowError(
		"rewrite_vtable_selects requires literal schema_key predicates; received ambiguous filter."
	);
	expect(trace).toHaveLength(0);
});

test("uses projected columns when select is narrowed", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const node = toRootOperationNode(
		parse(`
			SELECT v.schema_key, v.file_id
			FROM lix_internal_state_vtable AS v
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		trace,
		hasOpenTransaction: true,
	});

	expect(trace).toHaveLength(1);
	const payload = trace[0]!.payload as Record<string, unknown>;
	expect(payload.selected_columns).toEqual(["schema_key", "file_id"]);

	const { sql } = compile(rewritten);

	expect(sql).toContain('"w"."schema_key" as "schema_key"');
	expect(sql).toContain('"w"."file_id" as "file_id"');
	expect(sql).not.toContain('"w"."_pk" as "_pk"');
	expect(sql).not.toContain("txn.metadata");
	expect(sql).not.toContain("txn.plugin_key");
	expect(sql).not.toContain("lix_internal_change");
});

test("respects aliases when projecting columns", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const node = toRootOperationNode(
		parse(`
			SELECT v.schema_key AS schema_key_alias
			FROM lix_internal_state_vtable AS v
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		trace,
		hasOpenTransaction: true,
	});

	const payload = trace[0]!.payload as Record<string, unknown>;
	expect(payload.selected_columns).toEqual(["schema_key_alias"]);

	const { sql } = compile(rewritten);
	expect(sql).toContain('"w"."schema_key" as "schema_key_alias"');
	expect(sql).not.toContain('"w"."_pk" as "_pk"');
});

test("includes _pk across segments when explicitly selected", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const node = toRootOperationNode(
		parse(`
			SELECT v._pk, v.schema_key
			FROM lix_internal_state_vtable AS v
			WHERE v.schema_key = 'test_schema_key'
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map([["test_schema_key", "test_schema_key_cache_table"]]),
		trace,
		hasOpenTransaction: true,
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
	const node = toRootOperationNode(
		parse(`
			SELECT v.schema_key, v.writer_key
			FROM lix_internal_state_vtable AS v
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		hasOpenTransaction: true,
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain("LEFT JOIN lix_internal_state_writer ws_dst");
	expect(sql).toContain("LEFT JOIN lix_internal_state_writer ws_src");
	expect(sql.toUpperCase()).toContain("COALESCE(");
});

test("retains change join when metadata is selected", () => {
	const node = toRootOperationNode(
		parse(`
			SELECT v.metadata
			FROM lix_internal_state_vtable AS v
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		hasOpenTransaction: true,
	});

	const { sql } = compile(rewritten);
	expect(sql).toContain("lix_internal_change");
});

test("routes cache queries to mapped physical tables", () => {
	const node = toRootOperationNode(
		parse(`
			SELECT v.*
			FROM lix_internal_state_vtable AS v
			WHERE v.schema_key = 'test_schema_key'
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map([["test_schema_key", "test_schema_key_cache_table"]]),
		hasOpenTransaction: true,
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain('FROM "test_schema_key_cache_table"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBe(2);
});

test("includes only cache tables for matching schema filters", () => {
	const node = toRootOperationNode(
		parse(`
			SELECT v.*
			FROM lix_internal_state_vtable AS v
			WHERE v.schema_key = 'test_schema_key'
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map([
			["test_schema_key", "test_schema_key_cache_table"],
			["test_schema_key_other", "test_schema_key_other_cache_table"],
		]),
		hasOpenTransaction: true,
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain('FROM "test_schema_key_cache_table"');
	expect(sql).not.toContain('FROM "test_schema_key_other_cache_table"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBe(2);
});

test("unions cache tables when multiple schema filters are present", () => {
	const node = toRootOperationNode(
		parse(`
			SELECT v.*
			FROM lix_internal_state_vtable AS v
			WHERE (
				v.schema_key = 'test_schema_key'
				OR v.schema_key = 'test_schema_key_other'
			)
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map([
			["test_schema_key", "test_schema_key_cache_table"],
			["test_schema_key_other", "test_schema_key_other_cache_table"],
			["test_schema_key_unused", "test_schema_key_unused_cache_table"],
		]),
		hasOpenTransaction: true,
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain('FROM "test_schema_key_cache_table"');
	expect(sql).toContain('FROM "test_schema_key_other_cache_table"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBe(3);
	expect(sql).not.toContain("test_schema_key_unused_cache_table");
});

test("skips cache unions when no cache tables mapped", () => {
	const node = toRootOperationNode(
		parse(`
			SELECT v.*
			FROM lix_internal_state_vtable AS v
			WHERE v.schema_key = 'test_schema_key'
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		hasOpenTransaction: true,
	});

	const { sql } = compile(rewritten);

	expect(sql).not.toContain('FROM "test_schema_key_cache_table"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBe(1);
	expect(sql).not.toContain("cache.is_tombstone");
});

test("prunes transaction segment when transaction closed", () => {
	const node = toRootOperationNode(
		parse(`
			SELECT v.schema_key
			FROM lix_internal_state_vtable AS v
			WHERE v.schema_key = 'test_schema_key'
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		hasOpenTransaction: false,
	});

	const { sql } = compile(rewritten);

	const upper = sql.toUpperCase();

	expect(upper).not.toContain("LIX_INTERNAL_TRANSACTION_STATE");
	expect(upper).toContain("LIX_INTERNAL_STATE_ALL_UNTRACKED");
	const unionCount = upper.match(/\bUNION ALL\b/g) ?? [];
	expect(unionCount.length).toBe(0);
});

test("unions all available cache tables when no schema filter is provided", () => {
	const node = toRootOperationNode(
		parse(`
			SELECT v.*
			FROM lix_internal_state_vtable AS v
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map([
			["test_schema_key_one", "cache_table_one"],
			["test_schema_key_two", "cache_table_two"],
		]),
		hasOpenTransaction: true,
	});

	const { sql } = compile(rewritten);

	expect(sql).toContain('FROM "cache_table_one"');
	expect(sql).toContain('FROM "cache_table_two"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBeGreaterThanOrEqual(3);
});

test("handles multiple vtable references with selective projections", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const node = toRootOperationNode(
		parse(`
			SELECT a.schema_key, a.file_id, b.writer_key
			FROM lix_internal_state_vtable AS a
			INNER JOIN lix_internal_state_vtable AS b
				ON a.schema_key = b.schema_key
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		trace,
		hasOpenTransaction: true,
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

	const node = toRootOperationNode(
		parse(`
			SELECT v.*
			FROM lix_internal_state_vtable AS v
			WHERE v.schema_key = 'test_schema_key'
		`)
	);

	const rewritten = rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		hasOpenTransaction: true,
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
