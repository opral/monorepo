import { createNodeishMemoryFs } from "@lix-js/fs"
import { describe, it, expect } from "vitest"
import { shouldContentBePrerendered } from "./shouldContentBePrerendered.js"
import dedent from "dedent"

describe("should return `false`", () => {
	it("if no file exists", async () => {
		const fs = createNodeishMemoryFs()
		expect(await shouldContentBePrerendered(fs, "/")).toBe(false)
	})

	it("if file does not have a `prerender` export", async () => {
		const fs = createNodeishMemoryFs()
		fs.writeFile("/+layout.server.js", 'export const foo = "bar"')
		expect(await shouldContentBePrerendered(fs, "/")).toBe(false)
	})

	it("if file has a `prerender` export set to `false`", async () => {
		const fs = createNodeishMemoryFs()
		fs.writeFile("/+layout.js", "export const prerender = false")
		expect(await shouldContentBePrerendered(fs, "/")).toBe(false)
	})
})

describe("should return `true`", () => {
	it("if a file has a `prerender` export set to `true`", async () => {
		const fs = createNodeishMemoryFs()
		fs.writeFile("/+layout.server.js", "export const prerender = true")
		expect(await shouldContentBePrerendered(fs, "/")).toBe(true)
	})

	it("if a file has a `prerender` export set to `auto`", async () => {
		const fs = createNodeishMemoryFs()
		fs.writeFile("/+layout.js", 'export const prerender = "auto"')
		expect(await shouldContentBePrerendered(fs, "/")).toBe(true)
	})

	it("should work with TypeScript syntax", async () => {
		const fs = createNodeishMemoryFs()
		fs.writeFile(
			"/+layout.ts",
			dedent`
			export const prerender: boolean = true
		`,
		)
		expect(await shouldContentBePrerendered(fs, "/")).toBe(true)
	})

	it("should work with import statements", async () => {
		const fs = createNodeishMemoryFs()
		fs.writeFile(
			"/+layout.server.ts",
			dedent`
			import * from "foo"
			export const prerender: any = 'auto'
		`,
		)
		expect(await shouldContentBePrerendered(fs, "/")).toBe(true)
	})
})
