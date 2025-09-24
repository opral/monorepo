// @ts-nocheck
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
			.selectFrom("state as s")
			.selectAll()
			.where("s.schema_key", "=", "lix_key_value")
			.where("s.entity_id", "like", "bench_all_%")
			.compile(),
	});

	await writeExplain({
		filename: "explain.read-one.txt",
		query: lix.db
			.selectFrom("state as s")
			.selectAll()
			.where("s.schema_key", "=", "lix_key_value")
			.where("s.entity_id", "=", "bench_one_target")
			.compile(),
	});
});

afterAll(async () => {
	await lix?.close();
	lix = undefined;
});

describe("state benchmarks", () => {
	bench("insert 10 then read all", async () => {
		const instance = requireLix();
		const runId = runCounter++;
		const prefix = `bench_all_${runId}_`;
		const rows = Array.from({ length: 10 }, (_, i) => ({
			entity_id: `${prefix}${i}`,
			schema_key: "lix_key_value",
			file_id: "bench",
			plugin_key: "lix_own_entity",
			snapshot_content: { key: `${prefix}${i}`, value: { index: i } },
			writer_key: null,
		}));

		await instance.engine.executeQuerySync(
			instance.db.insertInto("state").values(rows).compile()
		);
		await instance.db
			.selectFrom("state")
			.selectAll()
			.where("schema_key", "=", "lix_key_value")
			.where("entity_id", "like", `${prefix}%`)
			.execute();
	});
});

bench("insert 10 then read specific key", async () => {
	const instance = requireLix();
	const runId = runCounter++;
	const prefix = `bench_one_${runId}_`;
	const rows = Array.from({ length: 10 }, (_, i) => ({
		entity_id: `${prefix}${i}`,
		schema_key: "lix_key_value",
		file_id: "bench",
		plugin_key: "lix_own_entity",
		snapshot_content: { key: `${prefix}${i}`, value: { index: i } },
		writer_key: null,
	}));
	const targetEntity = `${prefix}5`;

	await instance.engine.executeQuerySync(
		instance.db.insertInto("state").values(rows).compile()
	);
	await instance.db
		.selectFrom("state")
		.selectAll()
		.where("schema_key", "=", "lix_key_value")
		.where("entity_id", "=", targetEntity)
		.execute();
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
	const explained = (await instance.call("lix_explain_query", {
		query: compiled,
	})) as {
		plan: Array<{ detail?: string }>;
		original: { sql: string };
		rewritten: { sql: string };
	};
	const lines = explained.plan.map(
		(row: any) => row.detail ?? JSON.stringify(row)
	);
	const outPath = new URL(`./${args.filename}`, import.meta.url);
	const content = [
		"Original SQL:",
		explained.original.sql,
		"",
		"Rewritten SQL:",
		explained.rewritten.sql,
		"",
		"Plan:",
		...lines.map((line) => `  - ${line}`),
		"",
	].join("\n");
	await fs.writeFile(outPath, content, "utf8");
}
