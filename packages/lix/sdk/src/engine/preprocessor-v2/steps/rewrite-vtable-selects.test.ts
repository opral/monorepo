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
	expect(entry.step).toBe("rewriteVtableSelects");
	const payload = entry.payload as Record<string, unknown>;
	expect(payload.aliases).toEqual(["v"]);
	expect(payload.projection).toBe("selectAll");
	expect(payload.schema_key_predicates).toBe(1);
	expect(payload.reference_count).toBe(1);
	expect(payload.schema_key_literals).toEqual(["test_schema_key"]);
	expect(payload.schema_key_has_dynamic).toBe(false);
});

test("trace flags dynamic schema key filters", () => {
	const trace: PreprocessorTraceEntry[] = [];

	const node = internalQueryBuilder
		.selectFrom("lix_internal_state_vtable as v")
		.where("v.schema_key", "=", sql.raw("?") as any)
		.selectAll("v")
		.toOperationNode() as RootOperationNode;

	rewriteVtableSelects({
		node,
		storedSchemas: new Map(),
		cacheTables: new Map(),
		trace,
	});

	const entry = trace[0]!;
	const payload = entry.payload as Record<string, unknown>;
	expect(payload.schema_key_literals).toEqual([]);
	expect(payload.schema_key_has_dynamic).toBe(true);
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
