import { describe, test, expect } from "vitest";
import { InMemoryEnvironment } from "./in-memory.js";

async function exec(env: InMemoryEnvironment, sql: string, params?: unknown[]) {
	return env.call("lix_exec_sync", {
		sql,
		params,
	});
}

describe("InMemory environemnt", () => {
	test("initializes and executes basic SQL", async () => {
		const engine = new InMemoryEnvironment();
		await engine.open({
			boot: { args: { providePlugins: [] } },
			emit: () => {},
		});

		await exec(engine, "CREATE TABLE t(a)");
		await exec(engine, "INSERT INTO t(a) VALUES (?), (?)", [1, 2]);

		const result = (await exec(engine, "SELECT a FROM t ORDER BY a")) as {
			rows?: any[];
		};
		expect(result.rows?.length).toBe(2);
		expect(result.rows?.[0]?.a ?? result.rows?.[0]?.[0]).toBe(1);
		expect(result.rows?.[1]?.a ?? result.rows?.[1]?.[0]).toBe(2);

		const snapshot = await engine.export();
		expect(snapshot.byteLength).toBeGreaterThan(0);

		await engine.close();
	});

	test("returns engine handle from open()", async () => {
		const backend = new InMemoryEnvironment();
		const res = await backend.open({
			boot: { args: { providePlugins: [] } },
			emit: () => {},
		});

		// In-memory environment runs on the main thread; engine should be available
		expect(res && (res as any).engine).toBeDefined();

		await backend.close();
	});

	// execBatch removed; callers should loop over call('lix_exec_sync', ...) or use transactions explicitly.
});

test("export/import round-trip persists data", async () => {
	const b1 = new InMemoryEnvironment();
	await b1.open({ boot: { args: { providePlugins: [] } }, emit: () => {} });

	await exec(b1, "CREATE TABLE t(a)");
	await exec(b1, "INSERT INTO t(a) VALUES (?), (?)", [1, 2]);

	const snapshot = await b1.export();
	await b1.close();

	const b2 = new InMemoryEnvironment();
	await b2.create({ blob: snapshot });
	await b2.open({ boot: { args: { providePlugins: [] } }, emit: () => {} });

	const out = (await exec(b2, "SELECT a FROM t ORDER BY a")) as {
		rows?: any[];
	};
	expect(out.rows?.map((r: any) => r.a ?? r[0])).toEqual([1, 2]);

	await b2.close();
});

test("multiple engines are independent", async () => {
	const b1 = new InMemoryEnvironment();
	const b2 = new InMemoryEnvironment();

	await b1.open({ boot: { args: { providePlugins: [] } }, emit: () => {} });
	await b2.open({ boot: { args: { providePlugins: [] } }, emit: () => {} });

	await exec(b1, "CREATE TABLE t(a)");
	await exec(b2, "CREATE TABLE t(a)");

	await exec(b1, "INSERT INTO t(a) VALUES (?)", [42]);

	const r1 = (await exec(b1, "SELECT COUNT(*) AS c FROM t")) as {
		rows?: any[];
	};
	const r2 = (await exec(b2, "SELECT COUNT(*) AS c FROM t")) as {
		rows?: any[];
	};

	const c1 = Number((r1.rows?.[0] as any)?.c ?? (r1.rows?.[0] as any)?.[0]);
	const c2 = Number((r2.rows?.[0] as any)?.c ?? (r2.rows?.[0] as any)?.[0]);

	expect(c1).toBe(1);
	expect(c2).toBe(0);

	await b1.close();
	await b2.close();
});
