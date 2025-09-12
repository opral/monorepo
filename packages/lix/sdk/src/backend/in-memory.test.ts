import { describe, test, expect } from "vitest";
import { InMemoryBackend } from "./in-memory.js";

describe("InMemory backend", () => {
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

	test("returns runtime handle from open()", async () => {
		const backend = new InMemoryBackend();
		const res = await backend.open({
			boot: { args: { pluginsRaw: [] } },
			onEvent: () => {},
		});

		// In-memory backend runs on the main thread; runtime should be available
		expect(res && (res as any).runtime).toBeDefined();

		await backend.close();
	});

	// execBatch removed; callers should loop over exec() or use transactions explicitly.
});
