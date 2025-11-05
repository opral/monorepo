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
				(error as any).originalSql = "SELECT failing";
				(error as any).parameters = ["internal-param"];
				(error as any).rewrittenSql = "SELECT rewritten";
				throw error;
			}),
			close: vi.fn(),
		};
		const driver = new EnvironmentDriver({ backend } as any);
		const connection = await driver.acquireConnection();

		await expect(
			connection.executeQuery(CompiledQuery.raw("SELECT original"))
		).rejects.toThrow(
			/internal query \(failed\)[\s\S]*sql: SELECT failing[\s\S]*parameters:[\s\S]*1\. "internal-param"[\s\S]*rewrittenSql: SELECT rewritten/
		);
	});

	test("renders user query failure without internal block", async () => {
		const backend = {
			call: vi.fn(async () => {
				const error = new Error("boom");
				throw error;
			}),
			close: vi.fn(),
		};
		const driver = new EnvironmentDriver({ backend } as any);
		const connection = await driver.acquireConnection();

		await connection.executeQuery(CompiledQuery.raw("SELECT submitted")).then(
			() => {
				throw new Error("expected failure");
			},
			(error) => {
				const message = String(error);
				expect(message).toMatch(/user query[\s\S]*status: failed/);
				expect(message).not.toMatch(/internal query/);
			}
		);
	});

	test("renders internal query block when engine runs derived SQL", async () => {
		const backend = {
			call: vi.fn(async () => {
				const error = new Error("combo failure");
				(error as any).originalSql = "SELECT failing";
				(error as any).parameters = ["internal"];
				throw error;
			}),
			close: vi.fn(),
		};
		const driver = new EnvironmentDriver({ backend } as any);
		const connection = await driver.acquireConnection();

		await connection
			.executeQuery(CompiledQuery.raw("SELECT user", ["user-param"]))
			.then(
				() => {
					throw new Error("expected failure");
				},
				(error) => {
					const message = String(error);
					expect(message).toMatch(
						/user query[\s\S]*sql: SELECT user[\s\S]*parameters:[\s\S]*1\. "user-param"/
					);
					expect(message).toMatch(/internal query \(failed\)/);
					expect(message).toMatch(/sql: SELECT failing/);
					expect(message).toMatch(/parameters:[\s\S]*1\. "internal"/);
				}
			);
	});
});
