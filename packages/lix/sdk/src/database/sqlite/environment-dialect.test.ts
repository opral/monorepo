import { afterEach, describe, expect, test, vi } from "vitest";
import { EnvironmentDriver } from "./environment-dialect.js";
import { CompiledQuery } from "kysely";

describe("EnvironmentConnection", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	test("includes rewrittenSql in error message", async () => {
		const backend = {
			call: vi.fn(async () => {
				const error = new Error("SQLITE error");
				(error as any).rewrittenSql = "SELECT rewritten";
				throw error;
			}),
			close: vi.fn(),
		};
		const driver = new EnvironmentDriver({ backend } as any);
		const connection = await driver.acquireConnection();

		await expect(
			connection.executeQuery(CompiledQuery.raw("SELECT original"))
		).rejects.toThrow(/rewrittenSql: SELECT rewritten/);
	});
});
