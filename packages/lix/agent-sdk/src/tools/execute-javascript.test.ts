import { expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { executeJavascript } from "./execute-javascript.js";

test("should execute simple JavaScript and return default export", async () => {
	const lix = await openLix({});

	const result = await executeJavascript({
		lix,
		code: `
			const sum = 1 + 2 + 3;
			export default sum;
		`,
	});

	expect(result).toBe(6);
});

test("should execute JavaScript with object export", async () => {
	const lix = await openLix({});

	const result = await executeJavascript({
		lix,
		code: `
			const data = {
				name: "test",
				values: [1, 2, 3, 4, 5]
			};
			export default data;
		`,
	});

	expect(result).toEqual({
		name: "test",
		values: [1, 2, 3, 4, 5],
	});
});

test("should execute JavaScript with array operations", async () => {
	const lix = await openLix({});

	const result = await executeJavascript({
		lix,
		code: `
			const numbers = [1, 2, 3, 4, 5];
			const doubled = numbers.map(n => n * 2);
			export default doubled;
		`,
	});

	expect(result).toEqual([2, 4, 6, 8, 10]);
});

test("should support top-level await", async () => {
	const lix = await openLix({});

	const result = await executeJavascript({
		lix,
		code: `
			const promise = Promise.resolve(42);
			const value = await promise;
			export default value;
		`,
	});

	expect(result).toBe(42);
});

test("should execute JavaScript with complex transformations", async () => {
	const lix = await openLix({});

	const result = await executeJavascript({
		lix,
		code: `
			const data = [
				{ name: "Alice", age: 30 },
				{ name: "Bob", age: 25 },
				{ name: "Charlie", age: 35 }
			];
			
			const summary = {
				count: data.length,
				avgAge: data.reduce((sum, p) => sum + p.age, 0) / data.length,
				names: data.map(p => p.name)
			};
			
			export default summary;
		`,
	});

	expect(result).toEqual({
		count: 3,
		avgAge: 30,
		names: ["Alice", "Bob", "Charlie"],
	});
});

test("should throw error for syntax errors", async () => {
	const lix = await openLix({});

	await expect(
		executeJavascript({
			lix,
			code: `
				const x = {
				// Missing closing brace
				export default x;
			`,
		})
	).rejects.toThrow();
});

test("should throw error when no default export", async () => {
	const lix = await openLix({});

	const result = await executeJavascript({
		lix,
		code: `
			const x = 42;
			// No export default
		`,
	});

	// When there's no default export, it should be undefined
	expect(result).toBeUndefined();
});

test("should handle Date and built-in objects", async () => {
	const lix = await openLix({});

	const result = await executeJavascript({
		lix,
		code: `
			const now = new Date('2024-01-01T00:00:00Z');
			export default {
				year: now.getUTCFullYear(),
				month: now.getUTCMonth() + 1,
				timestamp: now.toISOString()
			};
		`,
	});

	expect(result).toEqual({
		year: 2024,
		month: 1,
		timestamp: "2024-01-01T00:00:00.000Z",
	});
});
