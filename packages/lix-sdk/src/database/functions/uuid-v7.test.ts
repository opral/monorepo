import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { uuidV7 } from "./uuid-v7.js";

test("uuidV7 returns deterministic values when deterministic mode is enabled", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	const id1 = uuidV7({ lix });
	const id2 = uuidV7({ lix });
	const id3 = uuidV7({ lix });

	// Should be valid UUID v7 format
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	expect(id1).toMatch(uuidRegex);
	expect(id2).toMatch(uuidRegex);
	expect(id3).toMatch(uuidRegex);

	// Should have deterministic pattern
	expect(id1).toMatch(/^01920000-0000-7000-8000-/);
	expect(id2).toMatch(/^01920000-0000-7000-8000-/);
	expect(id3).toMatch(/^01920000-0000-7000-8000-/);

	// Should be sequential
	const counter1 = parseInt(id1.slice(-8), 16);
	const counter2 = parseInt(id2.slice(-8), 16);
	const counter3 = parseInt(id3.slice(-8), 16);

	expect(counter2).toBe(counter1 + 1);
	expect(counter3).toBe(counter2 + 1);
});

test("uuidV7 returns random values when deterministic mode is disabled", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: false }],
	});

	const id1 = uuidV7({ lix });
	const id2 = uuidV7({ lix });
	const id3 = uuidV7({ lix });

	// Should be valid UUID v7 format
	const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-7[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
	expect(id1).toMatch(uuidRegex);
	expect(id2).toMatch(uuidRegex);
	expect(id3).toMatch(uuidRegex);

	// Should NOT have deterministic pattern
	expect(id1).not.toMatch(/^01920000-0000-7000-8000-/);
	expect(id2).not.toMatch(/^01920000-0000-7000-8000-/);
	expect(id3).not.toMatch(/^01920000-0000-7000-8000-/);

	// Should all be different
	expect(id1).not.toBe(id2);
	expect(id2).not.toBe(id3);
	expect(id1).not.toBe(id3);
});

test("uuidV7 toggles between deterministic and random", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	// Start with deterministic
	const deterministicId = uuidV7({ lix });
	expect(deterministicId).toMatch(/^01920000-0000-7000-8000-/);

	// Switch to random
	await lix.db
		.updateTable("key_value")
		.set({ value: false })
		.where("key", "=", "lix_deterministic_mode")
		.execute();

	const randomId = uuidV7({ lix });
	expect(randomId).not.toMatch(/^01920000-0000-7000-8000-/);

	// Switch back to deterministic
	await lix.db
		.updateTable("key_value")
		.set({ value: true })
		.where("key", "=", "lix_deterministic_mode")
		.execute();

	const deterministicId2 = uuidV7({ lix });
	expect(deterministicId2).toMatch(/^01920000-0000-7000-8000-/);
});

test("uuidV7 is persisted across lix instances", async () => {
	const lix1 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	// Generate some IDs to advance the counter
	const id1 = uuidV7({ lix: lix1 });
	const id2 = uuidV7({ lix: lix1 });
	const id3 = uuidV7({ lix: lix1 });

	// Create a new instance from the blob
	const blob = await lix1.toBlob();
	const lix2 = await openLix({ blob });

	// Next ID should continue from where we left off
	const id4 = uuidV7({ lix: lix2 });

	// Extract counters
	const counters = [id1, id2, id3, id4].map(id => parseInt(id.slice(-8), 16));

	// Verify they continue sequentially
	expect(counters[1]).toBe(counters[0]! + 1);
	expect(counters[2]).toBe(counters[1]! + 1);
	expect(counters[3]).toBe(counters[2]! + 1);
});

test("uuidV7 advances correctly with many operations", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	// Generate 100 UUIDs
	const uuids: string[] = [];
	for (let i = 0; i < 100; i++) {
		uuids.push(uuidV7({ lix }));
	}

	// All should match deterministic pattern
	for (const uuid of uuids) {
		expect(uuid).toMatch(/^01920000-0000-7000-8000-/);
	}

	// Extract counters
	const counters = uuids.map(id => parseInt(id.slice(-8), 16));

	// All should be strictly increasing
	for (let i = 1; i < counters.length; i++) {
		expect(counters[i]).toBe(counters[i - 1]! + 1);
	}

	// Verify the sequence span
	expect(counters[99]! - counters[0]!).toBe(99);
});