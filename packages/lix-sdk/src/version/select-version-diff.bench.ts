import { bench } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createVersion } from "./create-version.js";
import { selectVersionDiff as selectVersionDiff } from "./select-version-diff.js";

const COUNTS = {
	created: 1,
	updated: 1,
	deleted: 1,
} as const;

type Ctx = {
	lix: Awaited<ReturnType<typeof openLix>>;
	sourceId: string;
	targetId: string;
};

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

	const source = await createVersion({ lix, name: "bench_source" });
	const target = await createVersion({ lix, name: "bench_target" });

	// Seed created (only in source)
	for (let i = 0; i < COUNTS.created; i++) {
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: `created_${i}`,
				schema_key: "bench_diff_entity",
				file_id: "bench_file",
				version_id: source.id,
				plugin_key: "bench_plugin",
				snapshot_content: { v: i },
				schema_version: "1.0",
			})
			.execute();
	}

	// Seed deleted (only in target)
	for (let i = 0; i < COUNTS.deleted; i++) {
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: `deleted_${i}`,
				schema_key: "bench_diff_entity",
				file_id: "bench_file",
				version_id: target.id,
				plugin_key: "bench_plugin",
				snapshot_content: { v: i },
				schema_version: "1.0",
			})
			.execute();
	}

	// Seed updated (present in both, different change ids/content)
	for (let i = 0; i < COUNTS.updated; i++) {
		const id = `updated_${i}`;
		// target first (older)
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: id,
				schema_key: "bench_diff_entity",
				file_id: "bench_file",
				version_id: target.id,
				plugin_key: "bench_plugin",
				snapshot_content: { v: "old" },
				schema_version: "1.0",
			})
			.execute();
		// source later (newer)
		await lix.db
			.insertInto("state_all")
			.values({
				entity_id: id,
				schema_key: "bench_diff_entity",
				file_id: "bench_file",
				version_id: source.id,
				plugin_key: "bench_plugin",
				snapshot_content: { v: "new" },
				schema_version: "1.0",
			})
			.execute();
	}

	return { lix, sourceId: source.id, targetId: target.id } satisfies Ctx;
})();

bench("diffVersionQuery (exclude unchanged)", async () => {
	try {
		const { lix, sourceId, targetId } = await readyCtx;

		const qb = selectVersionDiff({
			lix,
			source: { id: sourceId },
			target: { id: targetId },
		}).where("diff.status", "!=", "unchanged");

		const rows = await qb.execute();
		// Consume result to prevent dead-code elimination
		if (!rows || rows.length === 0)
			throw new Error("unexpected empty diff in bench");
	} catch (error) {
		console.error("Error during diffVersionQuery bench:", error);
	}
});

bench("diffVersionQuery (full document diff)", async () => {
	const { lix, sourceId, targetId } = await readyCtx;
	const qb = selectVersionDiff({
		lix,
		source: { id: sourceId },
		target: { id: targetId },
	});

	const rows = await qb.execute();
	if (!rows || rows.length === 0)
		throw new Error("unexpected empty diff in bench");
});

