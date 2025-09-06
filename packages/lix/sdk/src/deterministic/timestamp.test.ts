import { expect, test } from "vitest";
import { timestamp } from "./timestamp.js";
import { openLix } from "../lix/open-lix.js";

test("timestamp returns deterministic values when deterministic mode is enabled", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: {
					enabled: true,
					bootstrap: true,
				},
				lixcol_version_id: "global",
			},
		],
	});

	const t1 = timestamp({ lix });
	const t2 = timestamp({ lix });
	const t3 = timestamp({ lix });

	// Verify they're sequential milliseconds from epoch
	const t1ms = new Date(t1).getTime();
	const t2ms = new Date(t2).getTime();
	const t3ms = new Date(t3).getTime();

	// Should be strictly increasing by 1ms each time
	expect(t2ms).toBe(t1ms + 1);
	expect(t3ms).toBe(t2ms + 1);

	// Should be from 1970
	expect(t1).toMatch(/^1970-01-01T00:00:00\.\d{3}Z$/);
	expect(t2).toMatch(/^1970-01-01T00:00:00\.\d{3}Z$/);
	expect(t3).toMatch(/^1970-01-01T00:00:00\.\d{3}Z$/);
});

test("timestamp returns real time when deterministic mode is disabled", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: {
					enabled: false,
				},
				lixcol_version_id: "global",
			},
		],
	});

	const before = Date.now();
	const t1 = timestamp({ lix });
	const after = Date.now();

	const t1Time = new Date(t1).getTime();

	// Should be within the test execution window
	expect(t1Time).toBeGreaterThanOrEqual(before);
	expect(t1Time).toBeLessThanOrEqual(after);

	// Should not be from 1970
	expect(t1).not.toMatch(/^1970-/);
});

test("timestamp toggles between deterministic and real time", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: {
					enabled: true,
				},
				lixcol_version_id: "global",
			},
		],
	});

	// Start with deterministic
	const t1 = timestamp({ lix });
	expect(t1).toMatch(/^1970-/);

	// Switch to real time by deleting the key (cleaner approach)
	await lix.db
		.deleteFrom("key_value")
		.where("key", "=", "lix_deterministic_mode")
		.execute();

	const t2 = timestamp({ lix });
	expect(t2).not.toMatch(/^1970-/);

	// Switch back to deterministic
	await lix.db
		.insertInto("key_value")
		.values({
			key: "lix_deterministic_mode",
			value: { enabled: true },
		})
		.execute();

	const t3 = timestamp({ lix });
	expect(t3).toMatch(/^1970-/);
});

test("timestamp is persisted across lix instances", async () => {
	const lix1 = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: {
					enabled: true,
				},
				lixcol_version_id: "global",
			},
		],
	});

	// Generate some timestamps to advance the counter
	const t1 = timestamp({ lix: lix1 });
	const t2 = timestamp({ lix: lix1 });
	const t3 = timestamp({ lix: lix1 });

	// Create a new instance from the blob
	const blob = await lix1.toBlob();
	const lix2 = await openLix({ blob });

	// Next timestamp should continue from where we left off
	const t4 = timestamp({ lix: lix2 });

	// Verify they continue sequentially
	const t1ms = new Date(t1).getTime();
	const t2ms = new Date(t2).getTime();
	const t3ms = new Date(t3).getTime();
	const t4ms = new Date(t4).getTime();

	expect(t2ms).toBe(t1ms + 1);
	expect(t3ms).toBe(t2ms + 1);
	expect(t4ms).toBe(t3ms + 1);
});

test("timestamp advances correctly with many operations", async () => {
	const lix = await openLix({
		keyValues: [
			{
				key: "lix_deterministic_mode",
				value: {
					enabled: true,
				},
				lixcol_version_id: "global",
			},
		],
	});

	// Generate 100 timestamps
	const timestamps: string[] = [];
	for (let i = 0; i < 100; i++) {
		timestamps.push(timestamp({ lix }));
	}

	// All should be strictly increasing by 1ms
	for (let i = 1; i < timestamps.length; i++) {
		const prev = new Date(timestamps[i - 1]!).getTime();
		const curr = new Date(timestamps[i]!).getTime();
		expect(curr).toBe(prev + 1);
	}

	// Verify the sequence span
	const firstMs = new Date(timestamps[0]!).getTime();
	const lastMs = new Date(timestamps[99]!).getTime();
	expect(lastMs - firstMs).toBe(99); // 99ms difference between first and last
});
