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

test("export/import round-trip persists data", async () => {
	const b1 = new InMemoryBackend();
	await b1.open({ boot: { args: { pluginsRaw: [] } }, onEvent: () => {} });

	await b1.exec("CREATE TABLE t(a)");
	await b1.exec("INSERT INTO t(a) VALUES (?), (?)", [1, 2]);

	const snapshot = await b1.export();
	await b1.close();

	const b2 = new InMemoryBackend();
	await b2.create({
		blob: snapshot,
		boot: { args: { pluginsRaw: [] } },
		onEvent: () => {},
	});

	const out = await b2.exec("SELECT a FROM t ORDER BY a");
	expect(out.rows?.map((r: any) => r.a ?? r[0])).toEqual([1, 2]);

	await b2.close();
});

test("multiple engines are independent", async () => {
	const b1 = new InMemoryBackend();
	const b2 = new InMemoryBackend();

	await b1.open({ boot: { args: { pluginsRaw: [] } }, onEvent: () => {} });
	await b2.open({ boot: { args: { pluginsRaw: [] } }, onEvent: () => {} });

	await b1.exec("CREATE TABLE t(a)");
	await b2.exec("CREATE TABLE t(a)");

	await b1.exec("INSERT INTO t(a) VALUES (?)", [42]);

	const r1 = await b1.exec("SELECT COUNT(*) AS c FROM t");
	const r2 = await b2.exec("SELECT COUNT(*) AS c FROM t");

	const c1 = Number((r1.rows?.[0] as any)?.c ?? (r1.rows?.[0] as any)?.[0]);
	const c2 = Number((r2.rows?.[0] as any)?.c ?? (r2.rows?.[0] as any)?.[0]);

	expect(c1).toBe(1);
	expect(c2).toBe(0);

	await b1.close();
	await b2.close();
});
