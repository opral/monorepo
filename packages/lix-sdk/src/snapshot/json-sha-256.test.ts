import { test, expect } from "vitest";
import { jsonSha256 } from "./json-sha-256.js";
import type { JSONType } from "../schema-definition/json-type.js";

test("sha256 returns the same hash for the same content irrespective of the property ordering", async () => {
	const obj1: JSONType = {
		a: "some data",
		b: 1,
		d: { f: "prop", e: "nested" },
	};
	const obj2: JSONType = {
		b: 1,
		a: "some data",
		d: { e: "nested", f: "prop" },
	};

	const hash1 = jsonSha256(obj1);
	const hash2 = jsonSha256(obj2);

	expect(hash1).toBe(hash2);
});

test("null is a valid json value", async () => {
	const hash1 = jsonSha256(null);
	const hash2 = jsonSha256(null);

	expect(hash1).toBe(hash2);
});

test("strings are hashed", async () => {
	const hash1 = jsonSha256("some data");
	const hash2 = jsonSha256("some data");

	expect(hash1).toBe(hash2);
});

test("numbers are hashed", async () => {
	const hash1 = jsonSha256(42);
	const hash2 = jsonSha256(42);

	expect(hash1).toBe(hash2);
});

test("booleans are hashed", async () => {
	const hash1 = jsonSha256(true);
	const hash2 = jsonSha256(true);

	expect(hash1).toBe(hash2);
});

test("arrays are hashed", async () => {
	const hash1 = jsonSha256([1, 2, 3]);
	const hash2 = jsonSha256([1, 2, 3]);

	expect(hash1).toBe(hash2);
});

test("objects are hashed", async () => {
	const hash1 = jsonSha256({ a: 1, b: 2 });
	const hash2 = jsonSha256({ a: 1, b: 2 });

	expect(hash1).toBe(hash2);
});