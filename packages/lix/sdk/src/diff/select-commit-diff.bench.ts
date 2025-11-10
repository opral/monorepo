import { afterAll, bench, describe } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createCheckpoint } from "../state/create-checkpoint.js";
import { selectCommitDiff } from "./select-commit-diff.js";

const COUNTS = {
	created: 10,
	updated: 10,
	deleted: 10,
} as const;

type DiffBenchCtx = {
	lix: Awaited<ReturnType<typeof openLix>>;
	beforeCommitId: string;
	afterCommitId: string;
};

async function createDiffBenchCtx(): Promise<DiffBenchCtx> {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	for (let i = 0; i < COUNTS.deleted; i++) {
		await lix.db
			.insertInto("key_value")
			.values({ key: `deleted_${i}`, value: i })
			.execute();
	}
	for (let i = 0; i < COUNTS.updated; i++) {
		await lix.db
			.insertInto("key_value")
			.values({ key: `updated_${i}`, value: "old" })
			.execute();
	}

	const c1 = await createCheckpoint({ lix });

	for (let i = 0; i < COUNTS.created; i++) {
		await lix.db
			.insertInto("key_value")
			.values({ key: `created_${i}`, value: i })
			.execute();
	}
	for (let i = 0; i < COUNTS.updated; i++) {
		await lix.db
			.updateTable("key_value")
			.set({ value: "new" })
			.where("key", "=", `updated_${i}`)
			.execute();
	}
	for (let i = 0; i < COUNTS.deleted; i++) {
		await lix.db
			.deleteFrom("key_value")
			.where("key", "=", `deleted_${i}`)
			.execute();
	}

	const c2 = await createCheckpoint({ lix });

	return {
		lix,
		beforeCommitId: c1.id,
		afterCommitId: c2.id,
	} satisfies DiffBenchCtx;
}

describe("selectCommitDiff baseline (full)", async () => {
	const ctx = await createDiffBenchCtx();

	afterAll(async () => {
		await ctx.lix.close();
	});

	bench("selectCommitDiff baseline (full)", async () => {
		const rows = await selectCommitDiff({
			lix: ctx.lix,
			before: ctx.beforeCommitId,
			after: ctx.afterCommitId,
		})
			.where("diff.file_id", "=", "lix")
			.where("diff.schema_key", "=", "lix_key_value")
			.execute();
		if (!rows || rows.length === 0) throw new Error("unexpected empty");
	});
});

describe.skip("selectCommitDiff full + pushdown scope", async () => {
	const ctx = await createDiffBenchCtx();

	afterAll(async () => {
		await ctx.lix.close();
	});

	bench("selectCommitDiff full + pushdown scope", async () => {
		const rows = await selectCommitDiff({
			lix: ctx.lix,
			before: ctx.beforeCommitId,
			after: ctx.afterCommitId,
			hints: { fileId: "lix", pluginKey: "lix_sdk" },
		})
			.where("diff.schema_key", "=", "lix_key_value")
			.execute();
		if (!rows || rows.length === 0) throw new Error("unexpected empty");
	});
});

describe.skip("selectCommitDiff changed-only (fast path)", async () => {
	const ctx = await createDiffBenchCtx();

	afterAll(async () => {
		await ctx.lix.close();
	});

	bench("selectCommitDiff changed-only (fast path)", async () => {
		const rows = await selectCommitDiff({
			lix: ctx.lix,
			before: ctx.beforeCommitId,
			after: ctx.afterCommitId,
			hints: { includeUnchanged: false },
		})
			.where("diff.file_id", "=", "lix")
			.where("diff.schema_key", "=", "lix_key_value")
			.execute();
		if (!rows || rows.length === 0) throw new Error("unexpected empty");
	});
});

describe.skip("selectCommitDiff changed-only + pushdown", async () => {
	const ctx = await createDiffBenchCtx();

	afterAll(async () => {
		await ctx.lix.close();
	});

	bench("selectCommitDiff changed-only + pushdown", async () => {
		const rows = await selectCommitDiff({
			lix: ctx.lix,
			before: ctx.beforeCommitId,
			after: ctx.afterCommitId,
			hints: {
				includeUnchanged: false,
				fileId: "lix",
				pluginKey: "lix_sdk",
			},
		})
			.where("diff.schema_key", "=", "lix_key_value")
			.execute();
		if (!rows || rows.length === 0) throw new Error("unexpected empty");
	});
});
