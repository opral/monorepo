import { afterAll, bench, describe } from "vitest";
import { openLix, type Lix } from "../../lix/open-lix.js";
import type { LixSchemaDefinition } from "../../schema-definition/definition.js";

const FILE_ID = "bench_insert_file";
const PLUGIN_KEY = "bench_insert_plugin";
const TEST_SCHEMA_KEY = "bench_vtable_insert_schema";
const SCHEMA_VERSION = "1.0";
const CHUNK_SIZE = 10;

const INSERT_SCHEMA: LixSchemaDefinition = {
	type: "object",
	additionalProperties: false,
	properties: {
		source: { type: "string" },
		version: { type: "string" },
		idx: { type: "integer" },
	},
	required: ["source"],
	"x-lix-key": TEST_SCHEMA_KEY,
	"x-lix-version": SCHEMA_VERSION,
	"x-lix-primary-key": ["/source"],
};

describe("state_by_version insert single row", async () => {
	const ctx = await prepareBenchContext();
	let seq = 0;

	afterAll(async () => {
		await ctx.lix.close();
	});

	bench("state_by_version insert single row", async () => {
		await ctx.lix.db
			.insertInto("state_by_version")
			.values(makeRow({ versionId: ctx.versionId, seq: seq++ }))
			.execute();
	});
});

describe("state_by_version insert chunk (10 rows)", async () => {
	const ctx = await prepareBenchContext();
	let batch = 0;

	afterAll(async () => {
		await ctx.lix.close();
	});

	bench("state_by_version insert chunk (10 rows)", async () => {
		const offset = batch++ * CHUNK_SIZE;
		const rows = Array.from({ length: CHUNK_SIZE }, (_, idx) =>
			makeRow({ versionId: ctx.versionId, seq: offset + idx })
		);
		await ctx.lix.db.insertInto("state_by_version").values(rows).execute();
	});
});

describe("state_by_version insert chunk (10 rows) inside transaction", async () => {
	const ctx = await prepareBenchContext();
	let batch = 0;

	afterAll(async () => {
		await ctx.lix.close();
	});

	bench(
		"state_by_version insert chunk (10 rows) inside transaction",
		async () => {
			const offset = batch++ * CHUNK_SIZE;
			const rows = Array.from({ length: CHUNK_SIZE }, (_, idx) =>
				makeRow({ versionId: ctx.versionId, seq: offset + idx })
			);
			await ctx.lix.db.transaction().execute(async (trx) => {
				await trx.insertInto("state_by_version").values(rows).execute();
			});
		}
	);
});

async function prepareBenchContext(): Promise<{
	lix: Lix;
	versionId: string;
}> {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
				lixcol_untracked: true,
			},
		],
	});

	await registerBenchSchema(lix);

	const { version_id: versionId } = await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirstOrThrow();

	return { lix, versionId };
}

async function registerBenchSchema(lix: Lix): Promise<void> {
	await lix.db
		.insertInto("stored_schema_by_version")
		.values({ value: INSERT_SCHEMA, lixcol_version_id: "global" })
		.execute();
}

function makeRow(args: { versionId: string; seq: number }) {
	const { versionId, seq } = args;
	return {
		entity_id: `bench_entity_${Date.now()}_${versionId}_${seq}`,
		schema_key: TEST_SCHEMA_KEY,
		file_id: FILE_ID,
		plugin_key: PLUGIN_KEY,
		snapshot_content: {
			source: `${FILE_ID}_${versionId}_${seq}`,
			version: versionId,
			idx: seq,
		},
		schema_version: SCHEMA_VERSION,
		version_id: versionId,
	};
}
