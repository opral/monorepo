import { bench } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createCheckpoint } from "./create-checkpoint.js";
import { createVersionFromCommit } from "../version/create-version-from-commit.js";
import { switchVersion } from "../version/switch-version.js";
import { transition } from "./index.js";

const N = 1;
const DEPTH = 2;

bench("transition no-op (baseline)", async () => {
	const lix = await openLix({});

	// Create a small state and checkpoint
	await lix.db
		.insertInto("key_value")
		.values({ key: "bench_noop", value: "1" })
		.execute();

	const cp = await createCheckpoint({ lix });

	// Version already points to cp; transition to same commit should be a no-op
	await transition({ lix, to: cp });
});

bench("transition with 100 additions", async () => {
	try {
		const lix = await openLix({});

		// Baseline empty state
		const emptyCp = await createCheckpoint({ lix });

		// Add N key_value rows and checkpoint
		const rows = Array.from({ length: N }, (_, i) => ({
			key: `add_${i}`,
			value: String(i),
		}));
		for (const row of rows) {
			await lix.db.insertInto("key_value").values(row).execute();
		}
		const addedCp = await createCheckpoint({ lix });

		// Create and switch to a version at the empty baseline
		const version = await createVersionFromCommit({
			lix,
			name: "bench_additions",
			commit: emptyCp,
		});
		await switchVersion({ lix, to: version });

		// Transition to the checkpoint with 100 additions
		await transition({ lix, to: addedCp });
	} catch (error) {
		console.error("Error during transition with 100 additions:", error);
	}
});

bench("transition with 100 deletions", async () => {
	const lix = await openLix({});

	// Start with N rows
	const rows = Array.from({ length: N }, (_, i) => ({
		key: `del_${i}`,
		value: String(i),
	}));
	for (const row of rows) {
		await lix.db.insertInto("key_value").values(row).execute();
	}
	const fullCp = await createCheckpoint({ lix });

	// Delete all rows and checkpoint
	await lix.db.deleteFrom("key_value").execute();
	const emptyCp = await createCheckpoint({ lix });

	// Create and switch to a version at the full baseline
	const version = await createVersionFromCommit({
		lix,
		name: "bench_deletions",
		commit: fullCp,
	});
	await switchVersion({ lix, to: version });

	// Transition to the empty checkpoint (generates explicit deletions)
	await transition({ lix, to: emptyCp });
});

bench("transition with 100 updates", async () => {
	const lix = await openLix({});

	// Start with N rows
	for (let i = 0; i < N; i++) {
		await lix.db
			.insertInto("key_value")
			.values({ key: `up_${i}`, value: "v0" })
			.execute();
	}
	const beforeCp = await createCheckpoint({ lix });

	// Update all N rows
	for (let i = 0; i < N; i++) {
		await lix.db
			.updateTable("key_value")
			.set({ value: "v1" })
			.where("key", "=", `up_${i}`)
			.execute();
	}
	const afterCp = await createCheckpoint({ lix });

	// Version at beforeCp, transition to afterCp
	const version = await createVersionFromCommit({
		lix,
		name: "bench_updates",
		commit: beforeCp,
	});
	await switchVersion({ lix, to: version });
	await transition({ lix, to: afterCp });
});

bench("transition mixed (40 add, 40 update, 20 delete)", async () => {
	const lix = await openLix({});

	const updateCount = Math.floor(N * 0.4); // 40
	const deleteCount = Math.floor(N * 0.2); // 20
	const addCount = N - updateCount - deleteCount; // 40

	// Baseline: updateCount + deleteCount rows
	for (let i = 0; i < updateCount + deleteCount; i++) {
		await lix.db
			.insertInto("key_value")
			.values({ key: `mix_${i}`, value: "base" })
			.execute();
	}
	const baseCp = await createCheckpoint({ lix });

	// Update first updateCount
	for (let i = 0; i < updateCount; i++) {
		await lix.db
			.updateTable("key_value")
			.set({ value: "upd" })
			.where("key", "=", `mix_${i}`)
			.execute();
	}
	// Delete last deleteCount
	for (let i = updateCount; i < updateCount + deleteCount; i++) {
		await lix.db
			.deleteFrom("key_value")
			.where("key", "=", `mix_${i}`)
			.execute();
	}
	// Add addCount new keys
	for (let i = 0; i < addCount; i++) {
		await lix.db
			.insertInto("key_value")
			.values({ key: `mix_new_${i}`, value: "new" })
			.execute();
	}
	const targetCp = await createCheckpoint({ lix });

	const version = await createVersionFromCommit({
		lix,
		name: "bench_mixed",
		commit: baseCp,
	});
	await switchVersion({ lix, to: version });
	await transition({ lix, to: targetCp });
});

bench("transition deep ancestry (depth=50)", async () => {
	const lix = await openLix({});

	const baseCp = await createCheckpoint({ lix });

	for (let i = 0; i < DEPTH; i++) {
		await lix.db
			.insertInto("key_value")
			.values({ key: `depth_key_${i}`, value: String(i) })
			.execute();
		await createCheckpoint({ lix });
	}

	const headCp = await createCheckpoint({ lix }); // idempotent, returns current head

	const version = await createVersionFromCommit({
		lix,
		name: "bench_depth",
		commit: baseCp,
	});
	await switchVersion({ lix, to: version });
	await transition({ lix, to: headCp });
});
