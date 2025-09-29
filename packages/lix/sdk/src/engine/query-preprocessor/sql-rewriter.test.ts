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

	test("expands view definitions when provided", () => {
		const query = "SELECT value FROM example_view";
		setSqlRewriterContext(
			JSON.stringify({
				views: { example_view: "SELECT 42 AS value" },
			})
		);
		const result = rewriteSql(query);

		expect(result.sql).toContain("42 AS value");
		expect(result.cacheHints).toBeUndefined();
	});
});
