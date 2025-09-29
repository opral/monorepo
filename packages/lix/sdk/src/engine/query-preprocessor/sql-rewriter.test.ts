import {
	initializeSqlRewriter,
	rewriteSql,
	setSqlRewriterContext,
} from "./sql-rewriter.js";
import { test, expect, describe, beforeAll } from "vitest";

describe("rewriteSql", () => {
	beforeAll(async () => {
		await initializeSqlRewriter();
	});

	test("round-trips unrelated SQL statements", () => {
		const query = "SELECT * FROM example WHERE id = 42";
		const result = rewriteSql(query);
		expect(result.sql).toBe(query);
		expect(result.cacheHints).toBeUndefined();
	});

	test("rewrites internal_state_reader with cache context", () => {
		const query =
			"SELECT * FROM internal_state_reader WHERE schema_key = 'mock_schema'";
		setSqlRewriterContext(
			JSON.stringify({
				tableCache: ["internal_state_cache_mock_schema"],
			})
		);
		const result = rewriteSql(query);

		expect(result.sql).toContain("internal_state_cache_mock_schema");
		expect(result.sql).not.toBe(query);
		expect(result.cacheHints?.internalStateReader?.schemaKeys).toEqual([
			"mock_schema",
		]);
	});

	test("rewrites internal_state_reader when schema key is parameterised", () => {
		const query = "SELECT * FROM internal_state_reader WHERE schema_key = ?";
		const baseContext = JSON.stringify({
			tableCache: ["internal_state_cache_mock_schema"],
		});
		setSqlRewriterContext(baseContext);
		const contextualParameters = JSON.stringify({
			tableCache: ["internal_state_cache_mock_schema"],
			parameters: ["mock_schema"],
		});
		const result = rewriteSql(query, contextualParameters);

		expect(result.sql).toContain("internal_state_cache_mock_schema");
		expect(result.cacheHints?.internalStateReader?.schemaKeys).toEqual([
			"mock_schema",
		]);
	});

	test("exposes expandedSql when view references internal_state_reader", () => {
		const query = "SELECT entity_id FROM state_reader_view";
		setSqlRewriterContext(
			JSON.stringify({
				views: {
					state_reader_view:
						"SELECT entity_id FROM internal_state_reader WHERE schema_key = 'mock_schema'",
				},
			})
		);

		const result = rewriteSql(query);

		expect(result.sql).toBe(query);
		expect(result.expandedSql).toBeDefined();
		expect(result.expandedSql).toContain("internal_transaction_state");
		expect(result.expandedSql).not.toBe(query);
	});

	test("does not rewrite views that do not touch internal_state_reader", () => {
		setSqlRewriterContext(
			JSON.stringify({
				views: {
					example_view: "SELECT value FROM other_view",
				},
			})
		);

		const result = rewriteSql("SELECT value FROM example_view");

		expect(result.sql).toBe("SELECT value FROM example_view");
		expect(result.expandedSql).toContain("other_view");
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

		expect(result.expandedSql).toBeDefined();
		expect(result.expandedSql ?? "").toContain("42 AS value");
	});

	test("expandedSql descends to internal_state_reader through nested views", () => {
		setSqlRewriterContext(
			JSON.stringify({
				views: {
					state_view: "SELECT * FROM state_all_view",
					state_all_view:
						"SELECT entity_id FROM internal_state_reader WHERE schema_key = 'mock_schema'",
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

		expect(result.sql).toBe(query);
		expect(result.expandedSql).toContain("42 AS value");
		expect(result.cacheHints).toBeUndefined();
	});
});
