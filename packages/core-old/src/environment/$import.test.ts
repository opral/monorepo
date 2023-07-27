// @vitest-environment jsdom

import { describe, expect, it } from "vitest"
import { initialize$import } from "./$import.js"
import { createMemoryFs } from "@inlang-git/fs"

describe("$import", async () => {
	const fs = createMemoryFs()
	await fs.writeFile(
		"./mock-module.js",
		`
		export function hello() {
			return "hello";
		}
		`
	)

	// mock module in a directory
	await fs.mkdir("./nested")
	await fs.writeFile(
		"./nested/mock-module-two.js",
		`
		export function hello() {
			return "world";
		}
		`
	)

	const $import = initialize$import({
		// @ts-ignore
		fs,
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
		const normalizeUrl = module.default
		expect(normalizeUrl("inlang.com")).toBe("http://inlang.com")
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
