import { test, expect } from "vitest";
import { jsonSha256 } from "./json-sha-256.js";

test("sha256 returns the same hash for the same content irrespective of the property ordering", async () => {
	const obj1 = { a: "some data", b: 1, d: { f: "prop", e: "nested" } };
	const obj2 = { b: 1, a: "some data", d: { e: "nested", f: "prop" } };

	const hash1 = jsonSha256(obj1);
	const hash2 = jsonSha256(obj2);

	expect(hash1).toBe(hash2);
});
