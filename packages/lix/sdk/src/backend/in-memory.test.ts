import { describe, test, expect, beforeEach } from "vitest";
import { InMemoryBackend } from "./in-memory.js";

describe("InMemory backend", () => {
	beforeEach(() => {
		// nothing
	});

	test("initializes and executes basic SQL", async () => {
		const engine = new InMemoryBackend();
		await engine.open({
			boot: { args: { pluginsRaw: [] } },
			onEvent: () => {},
		});

		await engine.exec("CREATE TABLE t(a)");
		await engine.exec("INSERT INTO t(a) VALUES (?), (?)", [1, 2]);

		const result = await engine.exec("SELECT a FROM t ORDER BY a");
		expect(result.rows?.length).toBe(2);
		expect(result.rows?.[0]?.a ?? result.rows?.[0]?.[0]).toBe(1);
		expect(result.rows?.[1]?.a ?? result.rows?.[1]?.[0]).toBe(2);

		const snapshot = await engine.export();
		expect(snapshot.byteLength).toBeGreaterThan(0);

		await engine.close();
	});

	test("execBatch runs sequentially", async () => {
		const engine = new InMemoryBackend();
		await engine.open({
			boot: { args: { pluginsRaw: [] } },
			onEvent: () => {},
		});
		await engine.exec("CREATE TABLE t(a)");
		const batch = [
			{ sql: "INSERT INTO t(a) VALUES (?)", params: [1] },
			{ sql: "INSERT INTO t(a) VALUES (?)", params: [2] },
		];
		const { results } = await engine.execBatch!(batch);
		expect(results.length).toBe(2);
		const out = await engine.exec("SELECT COUNT(*) as c FROM t");
		expect(out.rows?.[0]?.c ?? out.rows?.[0]?.[0]).toBe(2);
		await engine.close();
	});
});
