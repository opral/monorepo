import { describe, it, expect } from "vitest";
import type { JSONObject } from "./schema.js";

describe("JSONObject type", () => {
	it("should allow valid JSON objects", () => {
		const validObject: JSONObject = {
			name: "John",
			age: 30,
			isAdmin: false,
			details: {
				hobbies: ["reading", "gaming"],
				address: {
					street: "123 Main St",
					city: "Anytown",
				},
			},
		};

		expect(validObject).toBeDefined();
	});

	it("should not allow invalid JSON objects", () => {
		const invalidObject: JSONObject = {
			name: "John",
			// @ts-expect-error - undefined is not allowed in JSON
			age: undefined,
		};

		expect(invalidObject).toBeDefined();
	});

	it("should allow arrays of JSON objects", () => {
		const validArray: JSONObject[] = [
			{
				name: "Alice",
				age: 25,
			},
			{
				name: "Bob",
				age: 28,
			},
		];

		expect(validArray).toBeDefined();
	});

	it("should not allow functions in JSON objects", () => {
		const invalidObject: JSONObject = {
			name: "John",
			// @ts-expect-error - functions are not allowed in JSON
			greet: () => "Hello",
		};

		expect(invalidObject).toBeDefined();
	});
});
