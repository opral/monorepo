import { describe, test, expect } from "vitest";
import { InMemoryEnvironment } from "./in-memory.js";
async function exec(
	env: InMemoryEnvironment,
	statement: string,
	params?: unknown[]
) {
	const { engine } = (await env.open({
		boot: { args: { providePlugins: [] } },
		emit: () => {},
	})) as { engine?: any };
	if (!engine) throw new Error("Engine not initialized");

	return engine.executeSync({ sql: statement, parameters: params });
}

describe("InMemory environemnt", () => {
	test("initializes and executes basic SQL", async () => {
		const env = new InMemoryEnvironment();
		await env.open({
			boot: { args: { providePlugins: [] } },
			emit: () => {},
		});

		await exec(env, "CREATE TABLE t(a)");
		await exec(env, "INSERT INTO t(a) VALUES (?), (?)", [1, 2]);

		const result = await exec(env, "SELECT a FROM t ORDER BY a");
		expect(result.rows?.length ?? 0).toBe(2);
		expect(result.rows?.[0]?.a ?? result.rows?.[0]?.[0]).toBe(1);
		expect(result.rows?.[1]?.a ?? result.rows?.[1]?.[0]).toBe(2);

		const snapshot = await env.export();
		expect(snapshot.byteLength).toBeGreaterThan(0);

		await env.close();
	});

	test("returns engine handle from open()", async () => {
		const env = new InMemoryEnvironment();
		const res = await env.open({
			boot: { args: { providePlugins: [] } },
			emit: () => {},
		});
		expect(res && (res as any).engine).toBeDefined();
		await env.close();
	});
});

test("export/import round-trip persists data", async () => {
	const env1 = new InMemoryEnvironment();
	await env1.open({ boot: { args: { providePlugins: [] } }, emit: () => {} });

	await exec(env1, "CREATE TABLE t(a)");
	await exec(env1, "INSERT INTO t(a) VALUES (?), (?)", [1, 2]);

	const snapshot = await env1.export();
	await env1.close();

	const env2 = new InMemoryEnvironment();
	await env2.create({ blob: snapshot });
	await env2.open({ boot: { args: { providePlugins: [] } }, emit: () => {} });

	const result = await exec(env2, "SELECT a FROM t ORDER BY a");
	const values = result.rows?.map((r: any) => r.a ?? r[0]);
	expect(values).toEqual([1, 2]);

	await env2.close();
});

test("multiple engines are independent", async () => {
	const env1 = new InMemoryEnvironment();
	const env2 = new InMemoryEnvironment();

	await env1.open({ boot: { args: { providePlugins: [] } }, emit: () => {} });
	await env2.open({ boot: { args: { providePlugins: [] } }, emit: () => {} });

	await exec(env1, "CREATE TABLE t(a)");
	await exec(env2, "CREATE TABLE t(a)");

	await exec(env1, "INSERT INTO t(a) VALUES (?)", [42]);

	const r1 = await exec(env1, "SELECT COUNT(*) AS c FROM t");
	const r2 = await exec(env2, "SELECT COUNT(*) AS c FROM t");

	const c1 = Number(
		(r1.rows?.[0] as any)?.c ?? (r1.rows?.[0] as any)?.[0] ?? 0
	);
	const c2 = Number(
		(r2.rows?.[0] as any)?.c ?? (r2.rows?.[0] as any)?.[0] ?? 0
	);

	expect(c1).toBe(1);
	expect(c2).toBe(0);

	await env1.close();
	await env2.close();
});
