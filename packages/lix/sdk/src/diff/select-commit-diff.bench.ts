import { bench } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createCheckpoint } from "../state/create-checkpoint.js";
import { selectCommitDiff } from "./select-commit-diff.js";

const COUNTS = {
	created: 10,
	updated: 10,
	deleted: 10,
} as const;

type Ctx = {
	lix: Awaited<ReturnType<typeof openLix>>;
	beforeCommitId: string;
	afterCommitId: string;
};

// Build a simple commit chain using checkpoints: c1 -> c2
const readyCtx: Promise<Ctx> = (async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: { enabled: true },
				lixcol_version_id: "global",
			},
		],
	});

	// Seed initial state at working, then checkpoint -> c1
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

	// Apply changes then checkpoint -> c2
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

	return { lix, beforeCommitId: c1.id, afterCommitId: c2.id } satisfies Ctx;
})();

bench("selectCommitDiff baseline (full)", async () => {
	const { lix, beforeCommitId, afterCommitId } = await readyCtx;
	const rows = await selectCommitDiff({
		lix,
		before: beforeCommitId,
		after: afterCommitId,
	})
		.where("diff.file_id", "=", "lix")
		.where("diff.schema_key", "=", "lix_key_value")
		.execute();
	if (!rows || rows.length === 0) throw new Error("unexpected empty");
});

bench.skip("selectCommitDiff full + pushdown scope", async () => {
	const { lix, beforeCommitId, afterCommitId } = await readyCtx;
	const rows = await selectCommitDiff({
		lix,
		before: beforeCommitId,
		after: afterCommitId,
		hints: { fileId: "lix", pluginKey: "lix_own_entity" },
	})
		.where("diff.schema_key", "=", "lix_key_value")
		.execute();
	if (!rows || rows.length === 0) throw new Error("unexpected empty");
});

bench.skip("selectCommitDiff changed-only (fast path)", async () => {
	const { lix, beforeCommitId, afterCommitId } = await readyCtx;
	const rows = await selectCommitDiff({
		lix,
		before: beforeCommitId,
		after: afterCommitId,
		hints: { includeUnchanged: false },
	})
		.where("diff.file_id", "=", "lix")
		.where("diff.schema_key", "=", "lix_key_value")
		.execute();
	if (!rows || rows.length === 0) throw new Error("unexpected empty");
});

bench.skip("selectCommitDiff changed-only + pushdown", async () => {
	const { lix, beforeCommitId, afterCommitId } = await readyCtx;
	const rows = await selectCommitDiff({
		lix,
		before: beforeCommitId,
		after: afterCommitId,
		hints: {
			includeUnchanged: false,
			fileId: "lix",
			pluginKey: "lix_own_entity",
		},
	})
		.where("diff.schema_key", "=", "lix_key_value")
		.execute();
	if (!rows || rows.length === 0) throw new Error("unexpected empty");
});
