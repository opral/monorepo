import { test, expect } from "vitest";
import { isDeterministicMode } from "./is-deterministic-mode.js";
import { openLix } from "../lix/open-lix.js";
import { newLixFile } from "../lix/new-lix.js";

test("isDeterministicMode returns false when lix_deterministic_mode is not set", async () => {
	const lix = await openLix({ blob: await newLixFile() });

	const result = isDeterministicMode({ lix });

	expect(result).toBe(false);
});

test("isDeterministicMode returns false when lix_deterministic_mode is explicitly false", async () => {
	const lix = await openLix({
		blob: await newLixFile(),
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: false } }],
	});

	const result = isDeterministicMode({ lix });

	expect(result).toBe(false);
});

test("isDeterministicMode returns true when lix_deterministic_mode is true", async () => {
	const lix = await openLix({
		blob: await newLixFile(),
		keyValues: [{ key: "lix_deterministic_mode", value: { enabled: true } }],
	});

	const result = isDeterministicMode({ lix });

	expect(result).toBe(true);
});

test("isDeterministicMode returns true for enabled values loosely equal to true", async () => {
	const testCases = [
		{ enabled: 1, expected: true },
		{ enabled: "1", expected: true },
		{ enabled: true, expected: true },
	];

	for (const { enabled, expected } of testCases) {
		const lix = await openLix({
			blob: await newLixFile(),
			keyValues: [{ key: "lix_deterministic_mode", value: { enabled } }],
		});

		const result = isDeterministicMode({ lix });

		expect(result).toBe(expected);
	}
});

test("isDeterministicMode returns false for enabled values not loosely equal to true", async () => {
	const testCases = [
		{ enabled: "yes", expected: false },
		{ enabled: "true", expected: false },
		{ enabled: 2, expected: false },
		{ enabled: {}, expected: false },
		{ enabled: [], expected: false },
	];

	for (const { enabled, expected } of testCases) {
		const lix = await openLix({
			blob: await newLixFile(),
			keyValues: [{ key: "lix_deterministic_mode", value: { enabled } }],
		});

		const result = isDeterministicMode({ lix });

		expect(result).toBe(expected);
	}
});

test("isDeterministicMode returns false for falsy enabled values", async () => {
	const testCases = [
		{ enabled: null, expected: false },
		{ enabled: 0, expected: false },
		{ enabled: "", expected: false },
		{ enabled: undefined, expected: false },
		{ enabled: false, expected: false },
	];

	for (const { enabled, expected } of testCases) {
		const lix = await openLix({
			blob: await newLixFile(),
			keyValues: [{ key: "lix_deterministic_mode", value: { enabled } }],
		});

		const result = isDeterministicMode({ lix });

		expect(result).toBe(expected);
	}
});

test("isDeterministicMode works with only required properties from Lix", async () => {
	const lix = await openLix({ blob: await newLixFile() });

	// Create a minimal object with only required properties
	const minimalLix = {
		sqlite: lix.sqlite,
		db: lix.db,
	};

	const result = isDeterministicMode({ lix: minimalLix });

	expect(result).toBe(false);
});

test("isDeterministicMode can be changed at runtime", async () => {
	const lix = await openLix({ blob: await newLixFile() });

	// Initially false
	expect(isDeterministicMode({ lix })).toBe(false);

	// Set to true
	await lix.db
		.insertInto("key_value")
		.values({ key: "lix_deterministic_mode", value: { enabled: true } })
		.execute();

	expect(isDeterministicMode({ lix })).toBe(true);

	// Update to false
	await lix.db
		.updateTable("key_value")
		.where("key", "=", "lix_deterministic_mode")
		.set({ value: { enabled: false } })
		.execute();

	expect(isDeterministicMode({ lix })).toBe(false);
});
