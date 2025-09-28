import { beforeAll, afterEach, describe, expect, test, vi } from "vitest";
import type { SqliteWasmDatabase } from "../database/sqlite/create-in-memory-database.js";
import { createExecuteSync } from "./execute-sync.js";
import {
	initializeSqlRewriter,
	rewriteSql,
	setSqlRewriterContext,
} from "./query-preprocessor/sql-rewriter.js";

describe("createExecuteSync", () => {
	beforeAll(async () => {
		await initializeSqlRewriter();
	});

	afterEach(() => {
		setSqlRewriterContext(undefined);
	});

	test("rewrites SQL before executing against sqlite", async () => {
		setSqlRewriterContext(
			JSON.stringify({
				views: {
					cache_lookup: "SELECT 1 AS value",
				},
			})
		);

		const exec = vi.fn().mockReturnValue([{ value: 1 }]);
		const sqlite = { exec } as unknown as SqliteWasmDatabase;

		const executeSync = await createExecuteSync({ sqlite });

		const originalSql = "SELECT value FROM cache_lookup";
		const result = executeSync({ sql: originalSql });

		const { sql: rewrittenSql } = rewriteSql(originalSql);

		expect(exec).toHaveBeenCalledTimes(1);
		expect(exec).toHaveBeenCalledWith(
			expect.objectContaining({
				sql: rewrittenSql,
				returnValue: "resultRows",
				rowMode: "object",
			})
		);
		expect(rewrittenSql).not.toBe(originalSql);
		expect(rewrittenSql).toContain("SELECT 1 AS value");
		expect(result.rows).toEqual([{ value: 1 }]);
	});

	test("passes through bound parameters unchanged", async () => {
		const exec = vi.fn().mockReturnValue([]);
		const sqlite = { exec } as unknown as SqliteWasmDatabase;
		const executeSync = await createExecuteSync({ sqlite });

		const parameters = [1, "two", { three: 3 }];

		executeSync({
			sql: "SELECT ?",
			parameters,
		});

		expect(exec).toHaveBeenCalledWith(
			expect.objectContaining({ bind: parameters })
		);
	});
});
