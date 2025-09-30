import {
	initializeSqlRewriter,
	rewriteSql,
	setSqlRewriterContext,
	updateSqlRewriterContext,
	buildSqlRewriteContext,
} from "./sql-rewriter.js";
import { test, expect, describe, beforeAll } from "vitest";
import { openLix } from "../../lix/index.js";

describe("rewriteSql", () => {
	beforeAll(async () => {
		await initializeSqlRewriter();
	});

	test("round-trips unrelated SQL statements", () => {
		const query = "SELECT * FROM example WHERE id = 42";
		const result = rewriteSql(query);
		expect(result.rewrittenSql).toBe(query);
		expect(result.cacheHints).toBeUndefined();
	});

	test("rewrites internal_state_vtable with cache context", () => {
		const query =
			"SELECT * FROM internal_state_vtable WHERE schema_key = 'mock_schema'";
		setSqlRewriterContext(
			JSON.stringify({
				tableCache: ["internal_state_cache_mock_schema"],
			})
		);
		const result = rewriteSql(query);

		const expandedSql = result.expandedSql ?? "";
		expect(result.rewrittenSql).not.toBe(query);
		expect(result.rewrittenSql).not.toMatch(/FROM\s+internal_state_vtable/i);
		expect(result.rewrittenSql).toContain("internal_state_cache_mock_schema");
		expect(expandedSql).toContain("internal_state_cache_mock_schema");
	});

	test("rewrites internal_state_vtable when schema key is parameterised", () => {
		const query = "SELECT * FROM internal_state_vtable WHERE schema_key = ?";
		const baseContext = JSON.stringify({
			tableCache: ["internal_state_cache_mock_schema"],
		});
		setSqlRewriterContext(baseContext);
		const contextualParameters = JSON.stringify({
			tableCache: ["internal_state_cache_mock_schema"],
			parameters: ["mock_schema"],
		});
		const result = rewriteSql(query, contextualParameters);

		expect(result.rewrittenSql).toContain("internal_state_cache_mock_schema");
		expect(result.cacheHints?.internalStateVtable?.schemaKeys).toEqual([
			"mock_schema",
		]);
	});

	test("schema parameter is resolved correctly when other placeholders come first", () => {
		const query =
			"SELECT * FROM internal_state_vtable WHERE entity_id = ? AND version_id = ? AND schema_key = ?";
		const baseContext = JSON.stringify({
			tableCache: ["internal_state_cache_mock_schema"],
		});
		setSqlRewriterContext(baseContext);
		const contextualParameters = JSON.stringify({
			tableCache: ["internal_state_cache_mock_schema"],
			parameters: ["entity-123", "version-456", "mock_schema"],
		});
		const result = rewriteSql(query, contextualParameters);

		expect(result.rewrittenSql).toContain("internal_state_cache_mock_schema");
		expect(result.rewrittenSql).toContain(
			"WHERE entity_id = ? AND version_id = ?"
		);
		expect(result.cacheHints?.internalStateVtable?.schemaKeys).toEqual([
			"mock_schema",
		]);
	});

	test("emits fast single-schema plan for entity lookup", () => {
		const query =
			"SELECT json_extract(snapshot_content, '$.value.nano_id') AS nano_id FROM internal_state_vtable WHERE schema_key = 'lix_key_value' AND entity_id = 'lix_deterministic_mode' AND snapshot_content IS NOT NULL LIMIT 1";
		setSqlRewriterContext(
			JSON.stringify({
				tableCache: [
					"internal_state_cache_lix_key_value",
					"internal_state_cache_lix_version_descriptor",
				],
			})
		);

		const result = rewriteSql(query);

		expect(result.rewrittenSql).toContain("WITH RECURSIVE anc");
		expect(result.rewrittenSql).toContain("ORDER BY depth, priority");
		expect(result.rewrittenSql).not.toMatch(/NOT EXISTS/);
	});

	test("schema key filters inside IN clause are respected", () => {
		const query =
			"SELECT * FROM internal_state_vtable WHERE schema_key IN (?, ?)";
		setSqlRewriterContext(
			JSON.stringify({
				tableCache: [
					"internal_state_cache_mock_schema",
					"internal_state_cache_other_schema",
				],
			})
		);

		const contextualParameters = JSON.stringify({
			tableCache: [
				"internal_state_cache_mock_schema",
				"internal_state_cache_other_schema",
			],
			parameters: ["mock_schema", "other_schema"],
		});
		const result = rewriteSql(query, contextualParameters);

		expect(result.rewrittenSql).toContain("internal_state_cache_mock_schema");
		expect(result.rewrittenSql).toContain("internal_state_cache_other_schema");
		expect(result.cacheHints?.internalStateVtable?.schemaKeys).toEqual([
			"mock_schema",
			"other_schema",
		]);
	});

	test("internal_state_vtable rewrite avoids SELECT DISTINCT for targeted schema", () => {
		const query =
			"SELECT * FROM internal_state_vtable WHERE schema_key = 'mock_schema' LIMIT 1";
		setSqlRewriterContext(
			JSON.stringify({
				tableCache: ["internal_state_cache_mock_schema"],
			})
		);

		const result = rewriteSql(query);

		expect(result.rewrittenSql).not.toMatch(/SELECT DISTINCT/i);
		expect(result.rewrittenSql).toContain("internal_state_cache_mock_schema");
	});

	test("rewrites without cache tables when none are registered", () => {
		const query =
			"SELECT * FROM internal_state_vtable WHERE schema_key = 'non_cached'";
		setSqlRewriterContext(JSON.stringify({ tableCache: [] }));
		const result = rewriteSql(query);

		expect(result.rewrittenSql).toContain("internal_transaction_state");
		expect(result.rewrittenSql).not.toContain(
			"internal_state_cache_non_cached"
		);
		expect(result.cacheHints).toBeUndefined();
	});

	test("exposes expandedSql when view references internal_state_vtable", () => {
		const query = "SELECT entity_id FROM state_reader_view";
		setSqlRewriterContext(
			JSON.stringify({
				views: {
					state_reader_view:
						"SELECT entity_id FROM internal_state_vtable WHERE schema_key = 'mock_schema'",
				},
			})
		);

		const result = rewriteSql(query);

		expect(result.rewrittenSql).not.toBe(query);
		expect(result.rewrittenSql).not.toMatch(/FROM\s+internal_state_vtable/i);
		expect(result.rewrittenSql).toContain("internal_state_cache_mock_schema");
		expect(result.expandedSql).toBeDefined();
		expect(result.expandedSql ?? "").toContain("internal_transaction_state");
	});

	test("state_all queries rewrite away from internal_state_vtable", () => {
		const viewSql = `
			SELECT
				entity_id,
				schema_key,
				snapshot_content,
				schema_version
			FROM internal_state_vtable
			WHERE snapshot_content IS NOT NULL
		`;

		const baseContext = JSON.stringify({
			tableCache: ["internal_state_cache_mock_schema"],
			views: {
				state_all: viewSql,
			},
		});

		setSqlRewriterContext(baseContext);

		const query =
			"SELECT * FROM state_all WHERE schema_key = 'mock_schema' AND version_id = 'global'";
		const result = rewriteSql(query, baseContext);

		expect(result.rewrittenSql).not.toBe(query);
		expect(result.rewrittenSql).not.toMatch(/FROM\s+internal_state_vtable/i);
		expect(result.rewrittenSql).toContain("internal_state_cache_mock_schema");
	});

	test("key_value_all queries rewrite via cached state", async () => {
		const query =
			'SELECT "key" FROM "key_value_all" WHERE "key" = ? AND "lixcol_version_id" = ?';

		const lix = await openLix({});

		updateSqlRewriterContext({
			sqlite: lix.engine!.sqlite,
			runtimeCacheRef: lix.engine!.runtimeCacheRef,
		});

		const contextJson = buildSqlRewriteContext({
			engine: lix.engine!,
			parameters: ["foo", "global"],
		});

		const result = rewriteSql(query, contextJson);

		expect(result.rewrittenSql).not.toBe(query);
		expect(result.rewrittenSql).not.toMatch(/FROM\s+"?internal_state_vtable"?/i);
		expect(result.rewrittenSql).not.toMatch(/JOIN\s+"?internal_state_vtable"?/i);
		expect(result.rewrittenSql).toContain("internal_state_cache_lix_key_value");
		await lix.close();
	});

	test("key_value_all select via db executes without hitting vtable", async () => {
		const lix = await openLix({});
		const db = lix.db;

		await expect(
			db
				.selectFrom("key_value_all")
				.select("key")
				.where("key", "=", "foo")
				.where("lixcol_version_id", "=", "global")
				.executeTakeFirst()
		).resolves.toBeUndefined();

		await lix.close();
	});

	test("does not rewrite views that do not touch internal_state_vtable", () => {
		setSqlRewriterContext(
			JSON.stringify({
				views: {
					example_view: "SELECT value FROM other_view",
				},
			})
		);

		const result = rewriteSql("SELECT value FROM example_view");

		expect(result.rewrittenSql).toBe("SELECT value FROM example_view");
		expect(result.expandedSql).toBeUndefined();
	});

	test("recursively expands nested views", () => {
		setSqlRewriterContext(
			JSON.stringify({
				views: {
					outer_view: "SELECT * FROM middle_view",
					middle_view: "SELECT value FROM inner_view",
					inner_view: "SELECT 42 AS value",
				},
			})
		);

		const result = rewriteSql("SELECT * FROM outer_view");

		expect(result.rewrittenSql).toBe("SELECT * FROM outer_view");
		expect(result.expandedSql).toBeUndefined();
	});

	test("expandedSql descends to internal_state_vtable through nested views", () => {
		setSqlRewriterContext(
			JSON.stringify({
				views: {
					state_view: "SELECT * FROM state_all_view",
					state_all_view:
						"SELECT entity_id FROM internal_state_vtable WHERE schema_key = 'mock_schema'",
				},
			})
		);

		const result = rewriteSql("SELECT * FROM state_view");

		expect(result.expandedSql).toBeDefined();
		expect(result.expandedSql ?? "").toContain("internal_transaction_state");
	});

	test("expands view definitions when provided", () => {
		const query = "SELECT value FROM example_view";
		setSqlRewriterContext(
			JSON.stringify({
				views: { example_view: "SELECT 42 AS value" },
			})
		);
		const result = rewriteSql(query);

		expect(result.rewrittenSql).toBe(query);
		expect(result.expandedSql).toBeUndefined();
		expect(result.cacheHints).toBeUndefined();
	});
});
