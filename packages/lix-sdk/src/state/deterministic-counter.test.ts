import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { uuidV7 } from "../database/index.js";

test("deterministic mode returns the same uuid_v7 sequence in an independent clone", async () => {
	const lixA = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	// Create an independent clone with the same initial state
	const lixB = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	const seqA = [
		uuidV7({ lix: lixA }),
		uuidV7({ lix: lixA }),
		uuidV7({ lix: lixA }),
	];

	console.log("BEGIN SEQUENCE");
	const seqB = [
		uuidV7({ lix: lixB }),
		uuidV7({ lix: lixB }),
		uuidV7({ lix: lixB }),
	];

	expect(seqB).toEqual(seqA); // identical sequence → deterministic
});

/**
 * Counter is persisted and monotonically increasing across commits.
 */
test("deterministic counter is persited in toBlob()", async () => {
	/* ── 1. new lix in deterministic mode ──────────────────────────────── */
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	const last8 = (uuid: string) => parseInt(uuid.slice(-8), 16);

	const first = uuidV7({ lix });
	const count1 = last8(first);

	// creating multiple rows which will call the counter multiple times
	await lix.db
		.insertInto("key_value")
		.values([
			{ key: "a", value: "1" },
			{ key: "b", value: "2" },
		])
		.execute();

	const second = uuidV7({ lix });
	const count2 = last8(second);

	expect(count2).toBeGreaterThan(count1); // strictly monotone

	const lixClone = await openLix({ blob: await lix.toBlob() });

	const third = uuidV7({ lix: lixClone });
	const count3 = last8(third);

	expect(count3).toBeGreaterThan(count2); // persisted and still monotone
});

test("uuid_v7 differs when deterministic mode is *not* enabled", async () => {
	const lix1 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: false }],
	});

	const lix2 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: false }],
	});

	const id1 = uuidV7({ lix: lix1 });
	const id2 = uuidV7({ lix: lix2 });

	expect(id1).not.toEqual(id2);
});
