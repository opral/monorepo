import { beforeAll, afterEach, describe, expect, test, vi } from "vitest";
import type { SqliteWasmDatabase } from "../database/sqlite/create-in-memory-database.js";
import { createExecuteSync } from "./execute-sync.js";
import * as sqlRewriterModule from "./query-preprocessor/sql-rewriter.js";

const { initializeSqlRewriter, rewriteSql, setSqlRewriterContext } =
	sqlRewriterModule;

describe("createExecuteSync", () => {
	beforeAll(async () => {
		await initializeSqlRewriter();
	});

	afterEach(() => {
		setSqlRewriterContext(undefined);
	});

	test("rewrites internal_state_reader queries before hitting sqlite", async () => {
		const rewriteSpy = vi
			.spyOn(sqlRewriterModule, "rewriteSql")
			.mockReturnValue({ sql: "SELECT 1 AS value", cacheHints: undefined });

		const exec = vi.fn().mockReturnValue([{ value: 1 }]);
		const sqlite = { exec } as unknown as SqliteWasmDatabase;

		const executeSync = await createExecuteSync({
			engine: {
				sqlite,
				hooks: {} as any,
				runtimeCacheRef: {} as any,
			},
		});

		exec.mockClear();

		const originalSql =
			"SELECT snapshot_content FROM internal_state_reader WHERE schema_key = 'example'";
		const result = executeSync({ sql: originalSql });

		expect(rewriteSpy).toHaveBeenCalledWith(originalSql, undefined);
		expect(exec).toHaveBeenCalledTimes(1);
		expect(exec).toHaveBeenCalledWith(
			expect.objectContaining({
				sql: "SELECT 1 AS value",
				returnValue: "resultRows",
				rowMode: "object",
			})
		);
		expect(result.rows).toEqual([{ value: 1 }]);
		rewriteSpy.mockRestore();
	});

	test("passes through bound parameters unchanged", async () => {
		const exec = vi.fn().mockReturnValue([]);
		const sqlite = { exec } as unknown as SqliteWasmDatabase;
		const executeSync = await createExecuteSync({
			engine: {
				sqlite,
				hooks: {} as any,
				runtimeCacheRef: {} as any,
			},
		});

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
