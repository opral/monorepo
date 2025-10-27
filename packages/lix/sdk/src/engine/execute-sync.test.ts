import { describe, expect, test, vi } from "vitest";
import type { SqliteWasmDatabase } from "../database/sqlite/create-in-memory-database.js";
import { createExecuteSync } from "./execute-sync.js";
import type { QueryPreprocessorResult } from "./query-preprocessor/create-query-preprocessor.js";

describe("createExecuteSync", () => {
	test("passes through bound parameters unchanged", async () => {
		const exec = vi.fn().mockReturnValue([]);
		const sqlite = { exec } as unknown as SqliteWasmDatabase;
		const preprocess = vi.fn(
			({ sql, parameters }: QueryPreprocessorResult) => ({
				sql,
				parameters,
			})
		);

		const executeSync = createExecuteSync({
			engine: {
				sqlite,
				hooks: {} as any,
				runtimeCacheRef: {} as any,
				preprocessQuery: preprocess as any,
			},
		});

		const parameters = [1, "two", { three: 3 }];

		executeSync({ sql: "SELECT ?", parameters });

		expect(preprocess).toHaveBeenCalledWith(
			expect.objectContaining({ sql: "SELECT ?", parameters })
		);
		expect(exec).toHaveBeenCalledWith(
			expect.objectContaining({ bind: parameters })
		);
	});

	test("bypasses the preprocessor when specified", async () => {
		const exec = vi.fn().mockReturnValue([]);
		const sqlite = { exec } as unknown as SqliteWasmDatabase;
		const preprocess = vi.fn();

		const executeSync = createExecuteSync({
			engine: {
				sqlite,
				hooks: {} as any,
				runtimeCacheRef: {} as any,
				preprocessQuery: preprocess as any,
			},
		});

		const sql = "SELECT 1";
		const parameters = [] as any;

		executeSync({ sql, parameters, skipPreprocessing: true });

		expect(preprocess).not.toHaveBeenCalled();
		expect(exec).toHaveBeenCalledWith(
			expect.objectContaining({ sql, bind: parameters })
		);
	});
});
