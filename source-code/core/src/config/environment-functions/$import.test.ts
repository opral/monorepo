// @vitest-environment jsdom

import { describe, expect, it } from "vitest"
import { initialize$import } from "./$import.js"
import { fs } from "memfs"

describe("$import", () => {
	// mock module
	fs.writeFileSync(
		"/mock-module.js",
		`
		export function hello() {
			return "hello";
		}
		`,
		{ encoding: "utf-8" },
	)

	// mock module in a directory
	fs.mkdirSync("/nested")
	fs.writeFileSync(
		"/nested/mock-module-two.js",
		`
		export function hello() {
			return "world";
		}
		`,
		{ encoding: "utf-8" },
	)

	const $import = initialize$import({
		workingDirectory: "/",
		// @ts-ignore
		fs: fs.promises,
		fetch,
	})

	it("should import a module from a local path", async () => {
		const module = await $import("./mock-module.js")
		expect(module.hello()).toBe("hello")
	})

	it("should import a module from a nested local path", async () => {
		const module = await $import("./nested/mock-module-two.js")
		expect(module.hello()).toBe("world")
	})

	it("should import an ES module from a url", async () => {
		const module = await $import("https://cdn.jsdelivr.net/npm/normalize-url@7.2.0/index.js")
		// the default export is a url normalization function.
		// see https://github.com/sindresorhus/normalize-url/
		expect(module.default("inlang.com")).toBe("http://inlang.com")
	})

	it("should import a relative file based on the workingDirectory", async () => {
		const $import = initialize$import({
			workingDirectory: "/nested",
			// @ts-ignore
			fs: fs.promises,
			fetch,
		})
		const module = await $import("./mock-module-two.js")
		expect(module.hello()).toBe("world")
	})

	it("should throw if a module is loaded that is not an ES module", async () => {
		try {
			await $import("https://cdn.jsdelivr.net/npm/lodash@4.17.21")
			throw "function did not throw"
		} catch {
			expect(true).toBe(true)
		}
	})
})
