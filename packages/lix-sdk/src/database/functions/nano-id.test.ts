import { expect, test } from "vitest";
import { openLix } from "../../lix/open-lix.js";
import { nanoId } from "./nano-id.js";

test("nanoId returns deterministic values when deterministic mode is enabled", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	const id1 = nanoId({ lix });
	const id2 = nanoId({ lix });
	const id3 = nanoId({ lix });

	// Should have test_ prefix and 10 digits
	expect(id1).toMatch(/^test_\d{10}$/);
	expect(id2).toMatch(/^test_\d{10}$/);
	expect(id3).toMatch(/^test_\d{10}$/);

	// Extract counters
	const counter1 = parseInt(id1.slice(5), 10);
	const counter2 = parseInt(id2.slice(5), 10);
	const counter3 = parseInt(id3.slice(5), 10);

	// Should be sequential
	expect(counter2).toBe(counter1 + 1);
	expect(counter3).toBe(counter2 + 1);
});

test("nanoId returns random values when deterministic mode is disabled", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: false }],
	});

	const id1 = nanoId({ lix });
	const id2 = nanoId({ lix });
	const id3 = nanoId({ lix });

	// Should NOT have test_ prefix
	expect(id1).not.toMatch(/^test_/);
	expect(id2).not.toMatch(/^test_/);
	expect(id3).not.toMatch(/^test_/);

	// Should be 21 characters (default nanoid length)
	expect(id1.length).toBe(21);
	expect(id2.length).toBe(21);
	expect(id3.length).toBe(21);

	// Should all be different
	expect(id1).not.toBe(id2);
	expect(id2).not.toBe(id3);
	expect(id1).not.toBe(id3);
});

test("nanoId toggles between deterministic and random", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	// Start with deterministic
	const deterministicId = nanoId({ lix });
	expect(deterministicId).toMatch(/^test_\d{10}$/);

	// Switch to random
	await lix.db
		.updateTable("key_value")
		.set({ value: false })
		.where("key", "=", "lix_deterministic_mode")
		.execute();

	const randomId = nanoId({ lix });
	expect(randomId).not.toMatch(/^test_/);
	expect(randomId.length).toBe(21);

	// Switch back to deterministic
	await lix.db
		.updateTable("key_value")
		.set({ value: true })
		.where("key", "=", "lix_deterministic_mode")
		.execute();

	const deterministicId2 = nanoId({ lix });
	expect(deterministicId2).toMatch(/^test_\d{10}$/);
});

test("nanoId is persisted across lix instances", async () => {
	const lix1 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	// Generate some IDs to advance the counter
	const id1 = nanoId({ lix: lix1 });
	const id2 = nanoId({ lix: lix1 });
	const id3 = nanoId({ lix: lix1 });

	// Create a new instance from the blob
	const blob = await lix1.toBlob();
	const lix2 = await openLix({ blob });

	// Next ID should continue from where we left off
	const id4 = nanoId({ lix: lix2 });

	// Extract counters
	const counters = [id1, id2, id3, id4].map(id => parseInt(id.slice(5), 10));

	// Verify they continue sequentially
	expect(counters[1]).toBe(counters[0]! + 1);
	expect(counters[2]).toBe(counters[1]! + 1);
	expect(counters[3]).toBe(counters[2]! + 1);
});

test("nanoId advances correctly with many operations", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	// Generate 100 nanoIds
	const ids: string[] = [];
	for (let i = 0; i < 100; i++) {
		ids.push(nanoId({ lix }));
	}

	// All should have test_ prefix
	for (const id of ids) {
		expect(id).toMatch(/^test_\d{10}$/);
	}

	// Extract counters
	const counters = ids.map(id => parseInt(id.slice(5), 10));

	// All should be strictly increasing
	for (let i = 1; i < counters.length; i++) {
		expect(counters[i]).toBe(counters[i - 1]! + 1);
	}

	// Verify the sequence span
	expect(counters[99]! - counters[0]!).toBe(99);
});

test("nanoId format is consistent across different counter values", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	// Generate an ID with initial counter
	const id1 = nanoId({ lix });
	expect(id1).toMatch(/^test_\d{10}$/);
	expect(id1.length).toBe(15); // "test_" (5) + 10 digits

	// Generate many IDs to get different counter magnitudes
	for (let i = 0; i < 1000; i++) {
		nanoId({ lix });
	}

	const idAfter1000 = nanoId({ lix });
	expect(idAfter1000).toMatch(/^test_\d{10}$/);
	expect(idAfter1000.length).toBe(15); // Should still be padded to same length
});