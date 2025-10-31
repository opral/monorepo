import { expect, test } from "vitest";
import { parse as parseStatements } from "../sql-parser/parse.js";
import { rewriteVtableSelects } from "./rewrite-vtable-selects.js";
import { compile } from "../sql-parser/compile.js";
import type { PreprocessorTraceEntry } from "../types.js";
import { openLix } from "../../../lix/open-lix.js";
import { insertTransactionState } from "../../../state/transaction/insert-transaction-state.js";
import { getTimestamp } from "../../functions/timestamp.js";
import { updateStateCache } from "../../../state/cache/update-state-cache.js";
import { schemaKeyToCacheTableName } from "../../../state/cache/create-schema-cache-table.js";
import type { LixChangeRaw } from "../../../change/schema-definition.js";
import { getColumnPath } from "../sql-parser/ast-helpers.js";
import type {
	SegmentedStatementNode,
	SelectExpressionNode,
	SelectStatementNode,
	StatementSegmentNode,
} from "../sql-parser/nodes.js";

const always = {
	getStoredSchemas: () => new Map(),
	getCacheTables: () => new Map(),
	getSqlViews: () => new Map(),
	hasOpenTransaction: () => false,
	trace: undefined as PreprocessorTraceEntry[] | undefined,
	parameters: [] as ReadonlyArray<unknown>,
} as const;

const parseSql = (sql: string) => parseStatements(sql);

function rewrite(
	sql: string,
	overrides: Partial<Parameters<typeof rewriteVtableSelects>[0]> = {}
) {
	const statements = parseSql(sql);
	return rewriteVtableSelects({
		statements,
		...always,
		...overrides,
	});
}

function firstSegment<T extends StatementSegmentNode>(
	statements: readonly SegmentedStatementNode[]
): T {
	if (statements.length === 0) {
		throw new Error("expected at least one statement");
	}
	const [statement] = statements;
	if (!statement || statement.node_kind !== "segmented_statement") {
		throw new Error("expected segmented statement");
	}
	if (statement.segments.length === 0) {
		throw new Error("missing segments");
	}
	return statement.segments[0] as T;
}

function firstSelect(
	statements: readonly SegmentedStatementNode[]
): SelectStatementNode {
	const segment = firstSegment<StatementSegmentNode>(statements);
	if (segment.node_kind === "select_statement") {
		return segment;
	}
	if (segment.node_kind === "compound_select") {
		return segment.first;
	}
	throw new Error("expected select statement");
}

const compileSql = (statements: readonly SegmentedStatementNode[]) =>
	compile(statements).sql;

const compileOriginalSql = (sql: string) => compile(parseSql(sql)).sql;

test("rewrites to inline vtable subquery", () => {
	const rewritten = rewrite(
		`
		SELECT * FROM lix_internal_state_vtable
	`,
		{ hasOpenTransaction: () => true }
	);

	const sql = compileSql(rewritten);

	expect(sql.toLowerCase()).not.toContain(
		"lix_internal_state_vtable_rewritten"
	);
	expect(sql).toMatch(/FROM\s+\(/i);
	expect(sql).not.toMatch(/\bFROM\s+"lix_internal_state_vtable"\b/i);
});

test("resolves cache rows across recursive version inheritance chains", async () => {
	const lix = await openLix({});
	const schemaKey = "recursive_entity_schema";
	const schemaDefinition = {
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
	};

	await lix.db
		.insertInto("stored_schema")
		.values({ value: schemaDefinition })
		.execute();

	const timestamp = await getTimestamp({ lix });
	const makeDescriptorChange = (
		versionId: string,
		inherits: string | null
	): LixChangeRaw => ({
		id: `descriptor-${versionId}`,
		entity_id: versionId,
		schema_key: "lix_version_descriptor",
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		created_at: timestamp,
		snapshot_content: JSON.stringify({
			id: versionId,
			inherits_from_version_id: inherits,
		}),
	});

	updateStateCache({
		engine: lix.engine!,
		changes: [makeDescriptorChange("version-root", null)],
		version_id: "version-root",
		commit_id: "commit-root",
	});
	updateStateCache({
		engine: lix.engine!,
		changes: [makeDescriptorChange("version-mid", "version-root")],
		version_id: "version-mid",
		commit_id: "commit-mid",
	});
	updateStateCache({
		engine: lix.engine!,
		changes: [makeDescriptorChange("version-leaf", "version-mid")],
		version_id: "version-leaf",
		commit_id: "commit-leaf",
	});

	const dataChange: LixChangeRaw = {
		id: "cache-row-root",
		entity_id: "entity-recursive",
		schema_key: schemaKey,
		schema_version: "1.0",
		file_id: "lix",
		plugin_key: "lix_own_entity",
		created_at: timestamp,
		snapshot_content: JSON.stringify({
			id: "entity-recursive",
			name: "Root Version Value",
		}),
	};

	updateStateCache({
		engine: lix.engine!,
		changes: [dataChange],
		version_id: "version-root",
		commit_id: "commit-data",
	});

	const cacheTable = schemaKeyToCacheTableName(schemaKey);
	const rewritten = rewrite(
		`
		SELECT v.schema_key, v.version_id, v.inherited_from_version_id, v.snapshot_content
		FROM lix_internal_state_vtable AS v
		WHERE v.schema_key = '${schemaKey}'
		  AND v.version_id = 'version-leaf'
	`,
		{
			getCacheTables: () => new Map([[schemaKey, cacheTable]]),
			hasOpenTransaction: () => true,
		}
	);

	const { sql: rewrittenSql, parameters } = compile(rewritten);
	expect(rewrittenSql.toLowerCase()).toContain("version_inheritance");

	const rows = lix.engine!.sqlite.exec({
		sql: rewrittenSql,
		bind: parameters as any[],
		returnValue: "resultRows",
		rowMode: "object",
	}) as Array<Record<string, unknown>>;

	expect(rows).toHaveLength(1);
	const row = rows[0]!;
	expect(row.schema_key).toBe(schemaKey);
	expect(row.version_id).toBe("version-leaf");
	expect(row.inherited_from_version_id).toBe("version-root");
	expect(JSON.parse(String(row.snapshot_content))).toMatchObject({
		id: "entity-recursive",
		name: "Root Version Value",
	});
	await lix.close();
});

test("does not rewrite non-SELECT statements", () => {
	const sql = `
		UPDATE lix_internal_state_vtable
		SET schema_key = 'test'
	`;

	const original = compileOriginalSql(sql);
	const rewritten = rewrite(sql, { hasOpenTransaction: () => true });
	const rewrittenSql = compileSql(rewritten);

	expect(rewrittenSql).toBe(original);
	expect(rewrittenSql.toLowerCase()).not.toContain(
		"lix_internal_state_vtable_rewritten"
	);
});

test("does not rely on hoisted CTEs", () => {
	const rewritten = rewrite(
		`
		SELECT *
		FROM lix_internal_state_vtable
	`,
		{ hasOpenTransaction: () => true }
	);

	const sql = compileSql(rewritten);
	const normalized = sql.trim().toUpperCase();

	expect(normalized.startsWith("WITH")).toBe(false);
	expect(sql.toLowerCase()).not.toContain(
		"lix_internal_state_vtable_rewritten"
	);
	expect(sql).toMatch(/FROM\s+\(/i);
});

test("emits trace metadata with alias and filters", () => {
	const trace: PreprocessorTraceEntry[] = [];

	rewrite(
		`
		SELECT v.*
		FROM lix_internal_state_vtable AS v
		WHERE v.schema_key = 'test_schema_key'
	`,
		{ trace, hasOpenTransaction: () => true }
	);

	expect(trace).toHaveLength(1);
	const entry = trace[0]!;
	expect(entry.step).toBe("rewrite_vtable_selects");
	const payload = entry.payload as Record<string, unknown>;
	expect(payload.aliases).toEqual(["v"]);
	expect(payload.projection).toBe("selectAll");
	expect(payload.schema_key_predicates).toBe(1);
	expect(payload.reference_count).toBe(1);
	expect(payload.schema_key_literals).toEqual(["test_schema_key"]);
	expect(payload.selected_columns).toBeNull();
});

test("uses projected columns when select is narrowed", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const rewritten = rewrite(
		`
		SELECT v.schema_key, v.file_id
		FROM lix_internal_state_vtable AS v
	`,
		{ trace, hasOpenTransaction: () => true }
	);

	expect(trace).toHaveLength(1);
	const payload = trace[0]!.payload as Record<string, unknown>;
	expect(payload.selected_columns).toEqual(["schema_key", "file_id"]);

	const sql = compileSql(rewritten);

	expect(sql.toLowerCase()).toContain('"w"."schema_key" as "schema_key"');
	expect(sql.toLowerCase()).toContain('"w"."file_id" as "file_id"');
	expect(sql.toLowerCase()).not.toContain('"w"."_pk" as "_pk"');
	expect(sql.toLowerCase()).not.toContain("txn.metadata");
	expect(sql.toLowerCase()).not.toContain("txn.plugin_key");
	expect(sql.toLowerCase()).not.toContain("lix_internal_change");
});

test("respects aliases when projecting columns", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const rewritten = rewrite(
		`
		SELECT v.schema_key AS schema_key_alias
		FROM lix_internal_state_vtable AS v
	`,
		{ trace, hasOpenTransaction: () => true }
	);

	const payload = trace[0]!.payload as Record<string, unknown>;
	expect(payload.selected_columns).toEqual(["schema_key_alias"]);

	const sql = compileSql(rewritten);
	expect(sql.toLowerCase()).toContain('"w"."schema_key" as "schema_key_alias"');
	expect(sql.toLowerCase()).not.toContain('"w"."_pk" as "_pk"');
});

test("includes _pk across segments when explicitly selected", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const rewritten = rewrite(
		`
		SELECT v._pk, v.schema_key
		FROM lix_internal_state_vtable AS v
		WHERE v.schema_key = 'test_schema_key'
	`,
		{
			trace,
			getCacheTables: () =>
				new Map([["test_schema_key", "test_schema_key_cache_table"]]),
			hasOpenTransaction: () => true,
		}
	);

	const payload = trace[0]!.payload as Record<string, unknown>;
	expect(payload.selected_columns).toEqual(["_pk", "schema_key"]);

	const sql = compileSql(rewritten);
	expect(sql.toLowerCase()).toContain('"w"."_pk" as "_pk"');
	expect(sql.toLowerCase()).toContain('"w"."schema_key" as "schema_key"');
	expect(sql.toLowerCase()).toContain("'t' || '~' || lix_encode_pk_part");
	expect(sql.toLowerCase()).toContain("'u' || '~' || lix_encode_pk_part");
	expect(sql.toLowerCase()).toContain("'c' || '~' || lix_encode_pk_part");
});

test("includes hidden _pk only when explicitly projected", () => {
	const rewritten = rewrite(
		`
		SELECT v.*, v._pk
		FROM lix_internal_state_vtable AS v
	`,
		{ hasOpenTransaction: () => true }
	);

	const sql = compileSql(rewritten);
	expect(sql.toLowerCase()).toContain(" as _pk");
});

test("omits hidden _pk when not explicitly selected", () => {
	const rewritten = rewrite(
		`
		SELECT v.*
		FROM lix_internal_state_vtable AS v
	`,
		{ hasOpenTransaction: () => true }
	);

	const sql = compileSql(rewritten);
	expect(sql.toLowerCase()).not.toContain(" as _pk");
});

test("retains writer joins when writer_key is selected", () => {
	const rewritten = rewrite(
		`
		SELECT v.schema_key, v.writer_key
		FROM lix_internal_state_vtable AS v
	`,
		{ hasOpenTransaction: () => true }
	);

	const sql = compileSql(rewritten);

	expect(sql.toLowerCase()).toContain(
		"left join lix_internal_state_writer ws_dst"
	);
	expect(sql.toLowerCase()).toContain(
		"left join lix_internal_state_writer ws_src"
	);
	expect(sql.toLowerCase()).toContain("coalesce(");
});

test("retains change join when metadata is selected", () => {
	const rewritten = rewrite(
		`
		SELECT v.metadata
		FROM lix_internal_state_vtable AS v
	`,
		{ hasOpenTransaction: () => true }
	);

	const sql = compileSql(rewritten);
	expect(sql.toLowerCase()).toContain("lix_internal_change");
});

test("routes cache queries to mapped physical tables", () => {
	const rewritten = rewrite(
		`
		SELECT v.*
		FROM lix_internal_state_vtable AS v
		WHERE v.schema_key = 'test_schema_key'
	`,
		{
			getCacheTables: () =>
				new Map([["test_schema_key", "test_schema_key_cache_table"]]),
			hasOpenTransaction: () => true,
		}
	);

	const sql = compileSql(rewritten);

	expect(sql.toLowerCase()).toContain('from "test_schema_key_cache_table"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBe(6);
});

test("includes only cache tables for matching schema filters", () => {
	const rewritten = rewrite(
		`
		SELECT v.*
		FROM lix_internal_state_vtable AS v
		WHERE v.schema_key = 'test_schema_key'
	`,
		{
			getCacheTables: () =>
				new Map([
					["test_schema_key", "test_schema_key_cache_table"],
					["test_schema_key_other", "test_schema_key_other_cache_table"],
				]),
			hasOpenTransaction: () => true,
		}
	);

	const sql = compileSql(rewritten);

	expect(sql.toLowerCase()).toContain('from "test_schema_key_cache_table"');
	expect(sql.toLowerCase()).not.toContain(
		'from "test_schema_key_other_cache_table"'
	);
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBe(6);
});

test("unions cache tables when multiple schema filters are present", () => {
	const rewritten = rewrite(
		`
		SELECT v.*
		FROM lix_internal_state_vtable AS v
		WHERE (
			v.schema_key = 'test_schema_key'
			OR v.schema_key = 'test_schema_key_other'
		)
	`,
		{
			getCacheTables: () =>
				new Map([
					["test_schema_key", "test_schema_key_cache_table"],
					["test_schema_key_other", "test_schema_key_other_cache_table"],
					["test_schema_key_unused", "test_schema_key_unused_cache_table"],
				]),
			hasOpenTransaction: () => true,
		}
	);

	const sql = compileSql(rewritten);

	expect(sql.toLowerCase()).toContain('from "test_schema_key_cache_table"');
	expect(sql.toLowerCase()).toContain(
		'from "test_schema_key_other_cache_table"'
	);
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBe(8);
	expect(sql).not.toContain("test_schema_key_unused_cache_table");
});

test("skips cache unions when no cache tables mapped", () => {
	const rewritten = rewrite(
		`
		SELECT v.*
		FROM lix_internal_state_vtable AS v
		WHERE v.schema_key = 'test_schema_key'
	`,
		{ hasOpenTransaction: () => true }
	);

	const sql = compileSql(rewritten);

	expect(sql.toLowerCase()).not.toContain('from "test_schema_key_cache_table"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBe(4);
	expect(sql.toLowerCase()).not.toContain("cache.is_tombstone");
});

test("prunes transaction segment when transaction closed", () => {
	const rewritten = rewrite(
		`
		SELECT v.schema_key
		FROM lix_internal_state_vtable AS v
		WHERE v.schema_key = 'test_schema_key'
	`,
		{ hasOpenTransaction: () => false }
	);

	const sql = compileSql(rewritten);

	const upper = sql.toUpperCase();

	expect(upper).not.toContain("LIX_INTERNAL_TRANSACTION_STATE");
	expect(upper).toContain("LIX_INTERNAL_STATE_ALL_UNTRACKED");
	const unionCount = upper.match(/\bUNION ALL\b/g) ?? [];
	expect(unionCount.length).toBe(2);
});

test("unions all available cache tables when no schema filter is provided", () => {
	const rewritten = rewrite(
		`
		SELECT v.*
		FROM lix_internal_state_vtable AS v
	`,
		{
			getCacheTables: () =>
				new Map([
					["test_schema_key_one", "cache_table_one"],
					["test_schema_key_two", "cache_table_two"],
				]),
			hasOpenTransaction: () => true,
		}
	);

	const sql = compileSql(rewritten);

	expect(sql.toLowerCase()).toContain('from "cache_table_one"');
	expect(sql.toLowerCase()).toContain('from "cache_table_two"');
	const unions = sql.match(/\bUNION ALL\b/g) ?? [];
	expect(unions.length).toBeGreaterThanOrEqual(3);
});

test("handles multiple vtable references with selective projections", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const rewritten = rewrite(
		`
		SELECT a.schema_key, a.file_id, b.writer_key
		FROM lix_internal_state_vtable AS a
		INNER JOIN lix_internal_state_vtable AS b
			ON a.schema_key = b.schema_key
	`,
		{ trace, hasOpenTransaction: () => true }
	);

	expect(trace[0]!.payload).toMatchObject({ aliases: ["a", "b"] });

	const select = firstSelect(rewritten);
	const normalizedSql = compileSql(rewritten)
		.replace(/\s+/g, " ")
		.toLowerCase();

	const projectionColumns = select.projection
		.filter(
			(item): item is SelectExpressionNode =>
				item.node_kind === "select_expression"
		)
		.map((item) => {
			const expression = item.expression;
			if (expression.node_kind !== "column_reference") {
				throw new Error("Unexpected projection expression type.");
			}
			return getColumnPath(expression).join(".");
		});

	expect(projectionColumns).toEqual([
		"a.schema_key",
		"a.file_id",
		"b.writer_key",
	]);
	expect(normalizedSql).toContain("c.entity_id as entity_id");
	expect(normalizedSql).toContain("c.version_id as version_id");
	expect(normalizedSql).toContain("c.change_id as change_id");
	expect(normalizedSql).toContain("left join lix_internal_state_writer ws_dst");
	expect(normalizedSql).toContain("left join lix_internal_state_writer ws_src");
});

test("rewrites compound selects", () => {
	const trace: PreprocessorTraceEntry[] = [];
	const rewritten = rewrite(
		`
		SELECT v.schema_key
		FROM lix_internal_state_vtable AS v
		UNION ALL
		SELECT w.schema_key
		FROM lix_internal_state_vtable AS w
	`,
		{ trace, hasOpenTransaction: () => true }
	);

	expect(trace.length).toBeGreaterThanOrEqual(2);

	const sql = compileSql(rewritten).toLowerCase();
	expect(sql).toContain("union all");
	expect(sql).not.toContain("lix_internal_state_vtable as v");
	expect(sql).not.toContain("lix_internal_state_vtable as w");
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

	const rewritten = rewrite(
		`
		SELECT v.*
		FROM lix_internal_state_vtable AS v
		WHERE v.schema_key = 'test_schema_key'
	`,
		{ hasOpenTransaction: () => true }
	);

	const { sql: rewrittenSql, parameters } = compile(rewritten);
	const rows = lix.engine!.sqlite.exec({
		sql: rewrittenSql,
		bind: parameters as any[],
		returnValue: "resultRows",
		rowMode: "object",
	});

	expect(rows.length).toBeGreaterThan(0);
	expect(rows).toEqual(
		expect.arrayContaining([
			expect.objectContaining({
				entity_id: "entity_txn",
				schema_key: "test_schema_key",
				file_id: "file_txn",
			}),
		])
	);
});

test("narrows cache tables on placeholders", () => {
	const trace: PreprocessorTraceEntry[] = [];

	const rewritten = rewrite(
		`
	SELECT v.*
	FROM lix_internal_state_vtable AS v
	WHERE v.schema_key = ?
`,
		{
			trace,
			parameters: ["test_schema_key"],
			getCacheTables: () =>
				new Map([
					["test_schema_key", "test_schema_key_cache_table"],
					["other_schema_key", "other_schema_key_cache_table"],
				]),
			hasOpenTransaction: () => true,
		}
	);

	const sql = compileSql(rewritten);
	const lowered = sql.toLowerCase();
	expect(lowered).toContain('from "test_schema_key_cache_table"');
	expect(lowered).not.toContain('from "other_schema_key_cache_table"');

	expect(trace).toHaveLength(1);
	const payload = trace[0]!.payload as Record<string, unknown>;
	expect(payload.schema_key_literals).toEqual(["test_schema_key"]);
});

test("unions all cache tables if schema key is omitted", () => {
	const trace: PreprocessorTraceEntry[] = [];

	const rewritten = rewrite(
		`
	SELECT v.entity_id
	FROM lix_internal_state_vtable AS v
`,
		{
			trace,
			getCacheTables: () =>
				new Map([
					["test_schema_key", "test_schema_key_cache_table"],
					["other_schema_key", "other_schema_key_cache_table"],
				]),
			hasOpenTransaction: () => true,
		}
	);

	const sql = compileSql(rewritten);

	const lowered = sql.toLowerCase();
	expect(lowered).toContain('from "test_schema_key_cache_table"');
	expect(lowered).toContain('from "other_schema_key_cache_table"');

	expect(trace).toHaveLength(1);
	const payload = trace[0]!.payload as Record<string, unknown>;
	expect(payload.schema_key_literals).toEqual([]);
});

test.each([
	`select json_extract(snapshot_content, '$.value') as "value" from "lix_internal_state_vtable" 
		where "entity_id" = ? and "schema_key" = ? and "version_id" = ? and "snapshot_content" is not null`,
	`SELECT v.*
		FROM lix_internal_state_vtable AS v
		WHERE v.schema_key = 'test_schema_key'`,
])("select statements that are valid should not throw", async (query) => {
	const lix = await openLix({});

	const trace: PreprocessorTraceEntry[] = [];

	const rewritten = rewrite(query, {
		trace,
		getCacheTables: () => new Map(),
		hasOpenTransaction: () => true,
	});

	const sql = compileSql(rewritten);

	expect(() =>
		lix.engine!.sqlite.exec({
			sql,
			bind: [],
			returnValue: "resultRows",
			rowMode: "object",
		})
	).not.toThrow();
});

test("regression: filtered columns remain accessible after rewrite", async () => {
	const lix = await openLix({});

	const trace: PreprocessorTraceEntry[] = [];

	const rewritten = rewrite(
		`
		select "snapshot_content", "updated_at" from "lix_internal_state_vtable" 
		where "schema_key" = ? and "snapshot_content" is not null and "version_id" = ?
	`,
		{
			trace,
			getCacheTables: () => new Map(),
			hasOpenTransaction: () => true,
		}
	);

	const sql = compileSql(rewritten);

	expect(() =>
		lix.engine!.sqlite.exec({
			sql,
			bind: [],
			returnValue: "resultRows",
			rowMode: "object",
		})
	).not.toThrow();
});
