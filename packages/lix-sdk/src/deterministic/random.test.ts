import { expect, test } from "vitest";
import { openLix } from "../lix/open-lix.js";
import { random } from "./random.js";

test("random works in non-deterministic mode", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: false } }],
	});

	const values = new Set<number>();
	for (let i = 0; i < 1000; i++) {
		const r = random({ lix });
		expect(r).toBeGreaterThanOrEqual(0);
		expect(r).toBeLessThan(1);
		values.add(r);
	}

	// With a good RNG generating 1000 floats, the probability of getting
	// more than 50 duplicates is astronomically small (birthday paradox).
	// This threshold prevents flaky tests while still catching bad RNGs.
	expect(values.size).toBeGreaterThan(950);
});

test("random works in deterministic mode", async () => {
	const lix = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const sequence1 = [];
	for (let i = 0; i < 10; i++) {
		const r = random({ lix });
		expect(r).toBeGreaterThanOrEqual(0);
		expect(r).toBeLessThan(1);
		sequence1.push(r);
	}

	// All 10 values should be unique - deterministic doesn't mean constant
	const uniqueValues = new Set(sequence1);
	expect(uniqueValues.size).toBe(10);

	const blob = await lix.toBlob();
	const lix2 = await openLix({ blob });

	const sequence2 = [];
	for (let i = 0; i < 10; i++) {
		sequence2.push(random({ lix: lix2 }));
	}

	// After blob restore, sequence should continue from where it left off,
	// not restart from the beginning
	expect(sequence2).not.toEqual(sequence1);
	expect(sequence2[0]).not.toBe(sequence1[0]);
});

test("deterministic mode produces same sequence with same seed", async () => {
	const lix1 = await openLix({
		keyValues: [
			{ 
				key: "lix_deterministic_mode", 
				value: { 
					enabled: true,
					random_seed: "test-seed"
				} 
			},
		],
	});

	const sequence1 = [];
	for (let i = 0; i < 5; i++) {
		sequence1.push(random({ lix: lix1 }));
	}

	// Test state persistence - continue generating after blob save/restore
	const blob = await lix1.toBlob();
	const lix1b = await openLix({ blob });

	for (let i = 0; i < 5; i++) {
		sequence1.push(random({ lix: lix1b }));
	}

	const lix2 = await openLix({
		keyValues: [
			{ 
				key: "lix_deterministic_mode", 
				value: { 
					enabled: true,
					random_seed: "test-seed"
				} 
			},
		],
	});

	const sequence2 = [];
	for (let i = 0; i < 10; i++) {
		sequence2.push(random({ lix: lix2 }));
	}

	// Same seed should produce identical 10-number sequence,
	// including numbers generated after blob persistence
	expect(sequence1).toEqual(sequence2);
});

test("deterministic mode produces different sequences with different seeds", async () => {
	const lix1 = await openLix({
		keyValues: [
			{ 
				key: "lix_deterministic_mode", 
				value: { 
					enabled: true,
					random_seed: "seed-1"
				} 
			},
		],
	});

	const sequence1 = [];
	for (let i = 0; i < 100; i++) {
		sequence1.push(random({ lix: lix1 }));
	}

	const lix2 = await openLix({
		keyValues: [
			{ 
				key: "lix_deterministic_mode", 
				value: { 
					enabled: true,
					random_seed: "seed-2"
				} 
			},
		],
	});

	const sequence2: any[] = [];
	for (let i = 0; i < 100; i++) {
		sequence2.push(random({ lix: lix2 }));
	}

	// Different seeds should produce completely different sequences.
	// With 100 samples each, any overlap would indicate poor seeding.
	const overlap = sequence1.some((x) => sequence2.includes(x));
	expect(overlap).toBe(false);
});

test("random state persists across blob operations", async () => {
	const lix1 = await openLix({
		keyValues: [
			{ key: "lix_deterministic_bootstrap", value: true },
			{ key: "lix_deterministic_mode", value: { enabled: true } },
		],
	});

	const fullSequence = [];
	for (let i = 0; i < 6; i++) {
		fullSequence.push(random({ lix: lix1 }));
	}

	const lix2 = await openLix({
		keyValues: [
			{ key: "lix_deterministic_bootstrap", value: true },
			{ key: "lix_deterministic_mode", value: { enabled: true } },
		],
	});

	const beforeBlob = [];
	for (let i = 0; i < 3; i++) {
		beforeBlob.push(random({ lix: lix2 }));
	}

	const blob = await lix2.toBlob();
	const lix3 = await openLix({ blob });

	const afterBlob = [];
	for (let i = 0; i < 3; i++) {
		afterBlob.push(random({ lix: lix3 }));
	}

	// The state should persist through blob serialization.
	// The two instances should produce the exact same sequence
	// as if it was one continuous instance.
	expect(beforeBlob).toEqual(fullSequence.slice(0, 3));
	expect(afterBlob).toEqual(fullSequence.slice(3, 6));
});

test("random uses lix_id as default seed when no seed specified", async () => {
	// Create two instances without deterministic bootstrap
	const lix1 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const lix2 = await openLix({
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const sequence1 = [];
	const sequence2 = [];

	// Generate values from each instance
	for (let i = 0; i < 10; i++) {
		sequence1.push(random({ lix: lix1 }));
		sequence2.push(random({ lix: lix2 }));
	}

	// Without deterministic bootstrap, each instance gets a different lix_id,
	// so they will produce different sequences when using lix_id as default seed
	expect(sequence1).not.toEqual(sequence2);
	
	// But each sequence should be deterministic (verified by other tests)
});

test("random produces same sequence with deterministic bootstrap", async () => {
	// Create two instances with deterministic bootstrap
	const lix1 = await openLix({
		keyValues: [
			{ key: "lix_deterministic_bootstrap", value: true },
			{ key: "lix_deterministic_mode", value: { enabled: true } },
		],
	});

	const lix2 = await openLix({
		keyValues: [
			{ key: "lix_deterministic_bootstrap", value: true },
			{ key: "lix_deterministic_mode", value: { enabled: true } },
		],
	});

	const sequence1 = [];
	const sequence2 = [];

	// Generate values from each instance
	for (let i = 0; i < 10; i++) {
		sequence1.push(random({ lix: lix1 }));
		sequence2.push(random({ lix: lix2 }));
	}

	// With deterministic bootstrap, both instances get the same lix_id (boot_0000000000),
	// so they will produce the same sequence when using lix_id as default seed
	expect(sequence1).toEqual(sequence2);
});

test("random works after enabling deterministic mode", async () => {
	const lix = await openLix({});

	// Use random in non-deterministic mode first
	const nonDeterministicValue = random({ lix });
	expect(nonDeterministicValue).toBeGreaterThanOrEqual(0);
	expect(nonDeterministicValue).toBeLessThan(1);

	// Enable deterministic mode
	await lix.db
		.insertInto("key_value")
		.values({ key: "lix_deterministic_mode", value: { enabled: true } })
		.execute();

	// Generate deterministic values
	const sequence1 = [];
	for (let i = 0; i < 5; i++) {
		sequence1.push(random({ lix }));
	}

	// Save state and reload
	const blob = await lix.toBlob();
	const lix2 = await openLix({ blob });

	// Continue generating values
	const sequence2 = [];
	for (let i = 0; i < 5; i++) {
		sequence2.push(random({ lix: lix2 }));
	}

	// Values should continue from where they left off (deterministic state persisted)
	expect(sequence2[0]).not.toBe(sequence1[0]);
	
	// All values should be valid random numbers
	const allValues = [...sequence1, ...sequence2];
	for (const val of allValues) {
		expect(val).toBeGreaterThanOrEqual(0);
		expect(val).toBeLessThan(1);
	}
});

test("non-deterministic mode without key specified", async () => {
	const lix = await openLix({});

	const values = new Set<number>();
	for (let i = 0; i < 100; i++) {
		const r = random({ lix });
		expect(r).toBeGreaterThanOrEqual(0);
		expect(r).toBeLessThan(1);
		values.add(r);
	}

	// Even with only 100 samples, we expect high uniqueness
	// This also verifies that omitting the key defaults to non-deterministic
	expect(values.size).toBeGreaterThan(80);
});