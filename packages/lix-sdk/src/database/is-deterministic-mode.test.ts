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
		keyValues: [{ key: "lix_deterministic_mode", value: false }],
	});

	const result = isDeterministicMode({ lix });

	expect(result).toBe(false);
});

test("isDeterministicMode returns true when lix_deterministic_mode is true", async () => {
	const lix = await openLix({
		blob: await newLixFile(),
		keyValues: [{ key: "lix_deterministic_mode", value: true }],
	});

	const result = isDeterministicMode({ lix });

	expect(result).toBe(true);
});

test("isDeterministicMode returns true for values loosely equal to true", async () => {
	const testCases = [
		{ value: 1, expected: true },
		{ value: "1", expected: true },
		{ value: true, expected: true },
	];

	for (const { value, expected } of testCases) {
		const lix = await openLix({
			blob: await newLixFile(),
			keyValues: [{ key: "lix_deterministic_mode", value }],
		});

		const result = isDeterministicMode({ lix });

		expect(result).toBe(expected);
	}
});

test("isDeterministicMode returns false for values not loosely equal to true", async () => {
	const testCases = [
		{ value: "yes", expected: false },
		{ value: "true", expected: false },
		{ value: 2, expected: false },
		{ value: {}, expected: false },
		{ value: [], expected: false },
	];

	for (const { value, expected } of testCases) {
		const lix = await openLix({
			blob: await newLixFile(),
			keyValues: [{ key: "lix_deterministic_mode", value }],
		});

		const result = isDeterministicMode({ lix });

		expect(result).toBe(expected);
	}
});

test("isDeterministicMode returns false for falsy values", async () => {
	const testCases = [
		{ value: null, expected: false },
		{ value: 0, expected: false },
		{ value: "", expected: false },
		{ value: undefined, expected: false },
	];

	for (const { value, expected } of testCases) {
		const lix = await openLix({
			blob: await newLixFile(),
			keyValues: [{ key: "lix_deterministic_mode", value }],
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
		.values({ key: "lix_deterministic_mode", value: true })
		.execute();

	expect(isDeterministicMode({ lix })).toBe(true);

	// Update to false
	await lix.db
		.updateTable("key_value")
		.where("key", "=", "lix_deterministic_mode")
		.set({ value: false })
		.execute();

	expect(isDeterministicMode({ lix })).toBe(false);
});
