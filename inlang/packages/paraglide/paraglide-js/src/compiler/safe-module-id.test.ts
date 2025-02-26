import { test, expect } from "vitest";
import { toSafeModuleId } from "./safe-module-id.js";

test("handles emojis (because why not)", () => {
	expect(toSafeModuleId("helloWorld🍌")).toBe("helloworld__");
});

// https://github.com/opral/inlang-paraglide-js/issues/395
test("makes everything lowercase", () => {
	expect(toSafeModuleId("HelloWorld")).toBe("helloworld");
});

test('escapes "-" to "_"', () => {
	expect(toSafeModuleId("de-DE-bavaria")).toBe("de_de_bavaria");
});

test("prefixes with _ if it starts with a number", () => {
	expect(toSafeModuleId("123")).toBe("_123");
});

test("handles $ signs", () => {
	expect(toSafeModuleId("default_e$")).toBe("default_e_");
});

test("handles . dots", () => {
	expect(toSafeModuleId("hello.world.nested")).toBe("hello_world_nested");
});

test("handles : colons", () => {
	expect(toSafeModuleId("hello:world:nested")).toBe("hello_world_nested");
});

test("transforms js reserved keywords", async () => {
	expect(toSafeModuleId("import")).toBe("_import");
	expect(toSafeModuleId("let")).toBe("_let");
	// https://github.com/opral/inlang-paraglide-js/issues/331
	expect(toSafeModuleId("then")).toBe("_then");
});
