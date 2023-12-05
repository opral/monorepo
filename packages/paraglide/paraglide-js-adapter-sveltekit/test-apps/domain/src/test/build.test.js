import { describe, it, expect } from "vitest"
import { fileURLToPath } from "node:url"
import { resolve } from "node:path"
import fs from "node:fs/promises"

const build = fileURLToPath(new URL("../../build", import.meta.url))

/**
 * Read a file from the build folder
 * @param {string} path
 * @returns {Promise<string>}
 */
const read = async (path) => {
	path = resolve(build, path)
	console.log(path)
	return await fs.readFile(path, "utf-8")
}

// We're testing the english site here

describe("prefixing hrefs", () => {
	it("should not prefix internal links", async () => {
		const content = await read("index.html")
		expect(content).toContain('href="/about"')
	})

	it("should respect the hreflangs", async () => {
		const content = await read("index.html")
		expect(content).toContain('<a href="//site.de/"')
		expect(content).toContain('<a href="/"')
	})
})

describe("alternate tags", () => {
	it("should add alternate tags", async () => {
		const content = await read("index.html")
		expect(content).toContain('<link rel="alternate" hreflang="de" href="//site.de/">')
		expect(content).toContain('<link rel="alternate" hreflang="en" href="/">')
	})

	it("should add alternate tags to the about page", async () => {
		const content = await read("about.html")
		expect(content).toContain('<link rel="alternate" hreflang="de" href="//site.de/about')
		expect(content).toContain('<link rel="alternate" hreflang="en" href="/about')
	})
})
