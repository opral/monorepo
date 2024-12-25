import { it, expect } from "vitest";
import { isValidJSIdentifier } from "./index.js";

it("returns true if the string is a valid, non-reserved identifier", () => {
	expect(isValidJSIdentifier("hello")).toBe(true);
	expect(isValidJSIdentifier("helloWorld")).toBe(true);
	expect(isValidJSIdentifier("hello_world")).toBe(true);
	expect(isValidJSIdentifier("helloWorld123")).toBe(true);
	expect(isValidJSIdentifier("hello_world_123")).toBe(true);
	expect(isValidJSIdentifier("helloWorld123_")).toBe(true);
	expect(isValidJSIdentifier("hello_world_123_")).toBe(true);
});

it("returns false if the string is not a valid identifier", () => {
	expect(isValidJSIdentifier("")).toBe(false);
	expect(isValidJSIdentifier("123")).toBe(false);
	expect(isValidJSIdentifier("123hello")).toBe(false);
	expect(isValidJSIdentifier("hello-world")).toBe(false);
	expect(isValidJSIdentifier("hello world")).toBe(false);
	expect(isValidJSIdentifier("hello.world")).toBe(false);
	expect(isValidJSIdentifier("  hello world  ")).toBe(false);
	expect(isValidJSIdentifier("  hello_world  ")).toBe(false);
});

it("returns false if the string is a reserved keyword", () => {
	expect(isValidJSIdentifier("break")).toBe(false);
	expect(isValidJSIdentifier("case")).toBe(false);
	expect(isValidJSIdentifier("catch")).toBe(false);
	expect(isValidJSIdentifier("class")).toBe(false);
	expect(isValidJSIdentifier("const")).toBe(false);
	expect(isValidJSIdentifier("delete")).toBe(false);
	expect(isValidJSIdentifier("await")).toBe(false);
});
