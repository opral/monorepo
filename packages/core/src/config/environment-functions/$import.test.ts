import { describe, expect, it } from "vitest";
import { $import } from "./$import.js";

describe("$import", () => {
	it("should import a module from a local path", async () => {
		const mod = await $import("./$import.test.module.js");
		expect(mod.hello()).toBe("hello");
	});

	it("should import an ES module from a url", async () => {
		const mod = await $import(
			"https://cdn.jsdelivr.net/npm/normalize-url@7.2.0/index.js"
		);
		// the default export is a url normalization function.
		// see https://github.com/sindresorhus/normalize-url/
		expect(mod.default("inlang.com")).toBe("http://inlang.com");
	});

	it("should throw if a module is loaded that is not an ES module", async () => {
		try {
			await $import("https://cdn.jsdelivr.net/npm/lodash@4.17.21");
			throw "function did not throw";
		} catch {
			expect(true).toBe(true);
		}
	});
});
