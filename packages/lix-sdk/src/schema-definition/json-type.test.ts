import { expect, it } from "vitest";
import { isJsonType } from "./json-type.js";

it("detects type: 'object'", () => {
	expect(isJsonType({ type: "object" })).toBe(true);
	expect(isJsonType({ type: ["object", "null"] })).toBe(true);
});

it("detects type: 'array'", () => {
	expect(isJsonType({ type: "array" })).toBe(true);
	expect(isJsonType({ type: ["array", "null"] })).toBe(true);
});

it("detects anyOf with object or array", () => {
	expect(isJsonType({ anyOf: [{ type: "object" }, { type: "string" }] })).toBe(
		true
	);
	expect(isJsonType({ anyOf: [{ type: "array" }, { type: "number" }] })).toBe(
		true
	);
	expect(isJsonType({ anyOf: [{ type: "boolean" }, { type: "null" }] })).toBe(
		false
	);
});

it("returns false for non-json types", () => {
	expect(isJsonType({ type: "string" })).toBe(false);
	expect(isJsonType({ type: ["number", "null"] })).toBe(false);
	expect(isJsonType({})).toBe(false);
});
