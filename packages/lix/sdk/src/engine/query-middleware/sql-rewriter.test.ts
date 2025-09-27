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
		expect(rewriteSql(query)).toBe(query);
	});

	test("rewrites internal_state_reader with cache context", () => {
		const query =
			"SELECT * FROM internal_state_reader WHERE schema_key = 'mock_schema'";
		setSqlRewriterContext(
			JSON.stringify({
				tableCache: ["internal_state_cache_mock_schema"],
			})
		);
		const rewritten = rewriteSql(query);

		expect(rewritten).toContain("internal_state_cache_mock_schema");
		expect(rewritten).not.toBe(query);
	});

	test("expands view definitions when provided", () => {
		const query = "SELECT value FROM example_view";
		setSqlRewriterContext(
			JSON.stringify({
				views: { example_view: "SELECT 42 AS value" },
			})
		);
		const rewritten = rewriteSql(query);

		expect(rewritten).toContain("42 AS value");
	});
});
