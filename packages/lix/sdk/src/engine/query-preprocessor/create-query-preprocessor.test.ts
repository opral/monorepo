// @ts-nocheck

import { afterEach, describe, expect, test, vi } from "vitest";
import { createQueryPreprocessor } from "./create-query-preprocessor.js";
import type { QueryPreprocessor } from "./create-query-preprocessor.js";
import * as rewriteModule from "./sql-rewriter/rewrite-sql.js";

function createEngineStub() {
	return {
		sqlite: {} as unknown,
		hooks: {} as unknown,
		runtimeCacheRef: {} as unknown,
		executeSync: vi.fn(),
	};
}

describe("createQueryPreprocessor", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test.skip("runs rewriteSql before subsequent preprocessors", async () => {
		const rewriteSpy = vi
			.spyOn(rewriteModule, "rewriteSql")
			.mockReturnValue("rewritten sql");

		const stageBuilder: QueryPreprocessor = async () => ({
			sql,
			parameters,
		}) => ({
			sql: `${sql} /* stage */`,
			parameters,
		});

		const stage = await createQueryPreprocessor(createEngineStub(), [
			stageBuilder,
		]);

		const result = stage({ sql: "original sql", parameters: [] });

		expect(rewriteSpy).toHaveBeenCalledWith("original sql");
		expect(result.sql).toBe("rewritten sql /* stage */");
		// ensure downstream preprocessors received the rewritten SQL
		expect(stageBuilder).toHaveBeenCalledTimes(1);
	});

	test.skip("returns rewritten SQL when no preprocessors are registered", async () => {
		const rewriteSpy = vi
			.spyOn(rewriteModule, "rewriteSql")
			.mockReturnValue("rewritten sql");

		const stage = await createQueryPreprocessor(createEngineStub(), []);
		const parameters = Object.freeze([1, 2, 3]);
		const result = stage({ sql: "original sql", parameters });

		expect(rewriteSpy).toHaveBeenCalledWith("original sql");
		expect(result.sql).toBe("rewritten sql");
		expect(result.parameters).toBe(parameters);
	});
});
