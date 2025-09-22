import { bench, beforeAll, afterAll, describe } from "vitest";
import { promises as fs } from "node:fs";

import { openLix } from "../../lix/open-lix.js";
import type { CompiledQuery } from "kysely";

let lix: Awaited<ReturnType<typeof openLix>> | undefined;
let runCounter = 0;

beforeAll(async () => {
	lix = await openLix({});
	if (!lix) throw new Error("failed to open lix instance");

	// Enable deterministic mode for repeatable timings.
	await lix.db
		.deleteFrom("key_value")
		.where("key", "=", "lix_deterministic_mode")
		.execute();
	await lix.db
		.insertInto("key_value")
		.values({ key: "lix_deterministic_mode", value: { enabled: true } })
		.execute();

	await writeExplain({
		filename: "explain.read-all.txt",
		query: lix.db
			.selectFrom("key_value")
			.selectAll()
			.where("key", "like", "bench_all_%")
			.compile(),
	});

	await writeExplain({
		filename: "explain.read-one.txt",
		query: lix.db
			.selectFrom("key_value")
			.selectAll()
			.where("key", "=", "bench_one_target")
			.compile(),
	});
});

afterAll(async () => {
	await lix?.close();
	lix = undefined;
});

describe("key_value benchmarks", () => {
	bench("insert 10 then read all", async () => {
		const instance = requireLix();
		const runId = runCounter++;
		const prefix = `bench_all_${runId}_`;
		const rows = Array.from({ length: 10 }, (_, i) => ({
			key: `${prefix}${i}`,
			value: { index: i },
		}));

		await instance.db.insertInto("key_value").values(rows).execute();
		await instance.db
			.selectFrom("key_value")
			.selectAll()
			.where("key", "like", `${prefix}%`)
			.execute();
		await instance.db
			.deleteFrom("key_value")
			.where("key", "like", `${prefix}%`)
			.execute();
	});

	bench("insert 10 then read specific key", async () => {
		const instance = requireLix();
		const runId = runCounter++;
		const prefix = `bench_one_${runId}_`;
		const rows = Array.from({ length: 10 }, (_, i) => ({
			key: `${prefix}${i}`,
			value: { index: i },
		}));
		const targetKey = `${prefix}5`;

		await instance.db.insertInto("key_value").values(rows).execute();
		await instance.db
			.selectFrom("key_value")
			.selectAll()
			.where("key", "=", targetKey)
			.execute();
		await instance.db
			.deleteFrom("key_value")
			.where("key", "like", `${prefix}%`)
			.execute();
	});
});

function requireLix() {
	if (!lix) throw new Error("lix instance not initialised");
	return lix;
}

async function writeExplain(args: {
	filename: string;
	query: CompiledQuery<unknown>;
}) {
	const instance = requireLix();
	const compiled = args.query;
	const explain = instance.engine.executeSync({
		sql: `EXPLAIN QUERY PLAN ${compiled.sql}`,
		parameters: compiled.parameters,
	});
	const lines = explain.rows.map(
		(row: any) => row.detail ?? JSON.stringify(row)
	);
	const outPath = new URL(`./${args.filename}`, import.meta.url);
	await fs.writeFile(outPath, `${lines.join("\n")}\n`, "utf8");
}
