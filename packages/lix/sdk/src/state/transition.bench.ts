import { afterAll, bench, describe } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { createCheckpoint } from "./create-checkpoint.js";
import { createVersionFromCommit } from "../version/create-version-from-commit.js";
import { switchVersion } from "../version/switch-version.js";
import { transition } from "./transition.js";

const N = 5;
const DEPTH = 10;

describe("transition no-op (baseline)", async () => {
	const lix = await openLix({});

	await lix.db
		.insertInto("key_value")
		.values({ key: "bench_noop", value: "1" })
		.execute();

	const cp = await createCheckpoint({ lix });

	afterAll(async () => {
		await lix.close();
	});

	bench("transition no-op (baseline)", async () => {
		await transition({ lix, to: cp });
	});
});

describe("transition with 100 additions", async () => {
	const lix = await openLix({});

	const emptyCp = await createCheckpoint({ lix });

	for (let i = 0; i < N; i++) {
		await lix.db
			.insertInto("key_value")
			.values({ key: `add_${i}`, value: String(i) })
			.execute();
	}
	const addedCp = await createCheckpoint({ lix });

	const version = await createVersionFromCommit({
		lix,
		name: "bench_additions",
		commit: emptyCp,
	});
	await switchVersion({ lix, to: version });
	await transition({ lix, to: emptyCp });

	afterAll(async () => {
		await lix.close();
	});

	bench(
		"transition with 100 additions",
		async () => {
			await transition({ lix, to: addedCp });
		},
		{
			setup: (task) => {
				task.opts.beforeEach = async () => {
					await switchVersion({ lix, to: version });
					await transition({ lix, to: emptyCp });
				};
			},
		}
	);
});

describe("transition with 100 deletions", async () => {
	const lix = await openLix({});

	const deletionEntries = Array.from({ length: N }, (_, i) => ({
		key: `del_${i}`,
		value: String(i),
	}));
	const deletionKeys = deletionEntries.map((entry) => entry.key);
	for (const entry of deletionEntries) {
		await lix.db.insertInto("key_value").values(entry).execute();
	}
	const fullCp = await createCheckpoint({ lix });

	await lix.db
		.deleteFrom("key_value")
		.where("key", "in", deletionKeys)
		.execute();
	const emptyCp = await createCheckpoint({ lix });

	const version = await createVersionFromCommit({
		lix,
		name: "bench_deletions",
		commit: fullCp,
	});
	await switchVersion({ lix, to: version });
	await transition({ lix, to: fullCp });

	afterAll(async () => {
		await lix.close();
	});

	bench(
		"transition with 100 deletions",
		async () => {
			await transition({ lix, to: emptyCp });
		},
		{
			setup: (task) => {
				task.opts.beforeEach = async () => {
					await switchVersion({ lix, to: version });
					await transition({ lix, to: fullCp });
				};
			},
		}
	);
});

describe("transition with 100 updates", async () => {
	const lix = await openLix({});

	for (let i = 0; i < N; i++) {
		await lix.db
			.insertInto("key_value")
			.values({ key: `up_${i}`, value: "v0" })
			.execute();
	}
	const beforeCp = await createCheckpoint({ lix });

	for (let i = 0; i < N; i++) {
		await lix.db
			.updateTable("key_value")
			.set({ value: "v1" })
			.where("key", "=", `up_${i}`)
			.execute();
	}
	const afterCp = await createCheckpoint({ lix });

	const version = await createVersionFromCommit({
		lix,
		name: "bench_updates",
		commit: beforeCp,
	});
	await switchVersion({ lix, to: version });
	await transition({ lix, to: beforeCp });

	afterAll(async () => {
		await lix.close();
	});

	bench(
		"transition with 100 updates",
		async () => {
			await transition({ lix, to: afterCp });
		},
		{
			setup: (task) => {
				task.opts.beforeEach = async () => {
					await switchVersion({ lix, to: version });
					await transition({ lix, to: beforeCp });
				};
			},
		}
	);
});

describe("transition mixed (40 add, 40 update, 20 delete)", async () => {
	const lix = await openLix({});

	const updateCount = Math.floor(N * 0.4);
	const deleteCount = Math.floor(N * 0.2);
	const addCount = N - updateCount - deleteCount;

	for (let i = 0; i < updateCount + deleteCount; i++) {
		await lix.db
			.insertInto("key_value")
			.values({ key: `mix_${i}`, value: "base" })
			.execute();
	}
	const baseCp = await createCheckpoint({ lix });

	for (let i = 0; i < updateCount; i++) {
		await lix.db
			.updateTable("key_value")
			.set({ value: "upd" })
			.where("key", "=", `mix_${i}`)
			.execute();
	}
	for (let i = updateCount; i < updateCount + deleteCount; i++) {
		await lix.db
			.deleteFrom("key_value")
			.where("key", "=", `mix_${i}`)
			.execute();
	}
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
	await transition({ lix, to: baseCp });

	afterAll(async () => {
		await lix.close();
	});

	bench(
		"transition mixed (40 add, 40 update, 20 delete)",
		async () => {
			await transition({ lix, to: targetCp });
		},
		{
			setup: (task) => {
				task.opts.beforeEach = async () => {
					await switchVersion({ lix, to: version });
					await transition({ lix, to: baseCp });
				};
			},
		}
	);
});

describe("transition deep ancestry (depth=50)", async () => {
	const lix = await openLix({});

	const baseCp = await createCheckpoint({ lix });

	let currentCp = baseCp;
	for (let i = 0; i < DEPTH; i++) {
		await lix.db
			.insertInto("key_value")
			.values({ key: `depth_key_${i}`, value: String(i) })
			.execute();
		currentCp = await createCheckpoint({ lix });
	}
	const headCp = currentCp;

	const version = await createVersionFromCommit({
		lix,
		name: "bench_depth",
		commit: baseCp,
	});
	await switchVersion({ lix, to: version });
	await transition({ lix, to: baseCp });

	afterAll(async () => {
		await lix.close();
	});

	bench(
		"transition deep ancestry (depth=50)",
		async () => {
			await transition({ lix, to: headCp });
		},
		{
			setup: (task) => {
				task.opts.beforeEach = async () => {
					await switchVersion({ lix, to: version });
					await transition({ lix, to: baseCp });
				};
			},
		}
	);
});
