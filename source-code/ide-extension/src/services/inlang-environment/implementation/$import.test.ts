import { it, expect, afterAll } from "vitest"
import fs from "node:fs"
import { $import } from "./$import.js"

const currentDirectoryPath = new URL(import.meta.url).pathname.replace(/\/[^/]+$/, "/")
const tempdir = fs.mkdtempSync(currentDirectoryPath)

afterAll(() => {
	fs.rmSync(tempdir, { recursive: true, force: true })
})

it("should transpile esm to cjs code which can then be imported with require", async () => {
	fs.writeFileSync(
		`${tempdir}/testfile1.js`,
		`
    export default function name() {
      return "Inlang"
    }
    export function hello(x) {
      return "Hello " + x
    }
  `,
		{ encoding: "utf8" },
	)
	const module = await $import(`${tempdir}/testfile1.js`)
	expect(module.default).toBe("Inlang")
	expect(module.hello("World")).toBe("Hello World")
})

it("should throw if the imported file is invalid", async () => {
	fs.writeFileSync(`${tempdir}/testfile2.js`, `export invalid function name()`, {
		encoding: "utf8",
	})
	expect($import(`${tempdir}/testfile2.js`)).rejects.toThrow()
})

it("should be able to import an inlang plugin", async () => {
	const { default: plugin } = await $import(`${currentDirectoryPath}/$import.test.plugin.js`)
	const pluginAfterSetup = plugin()
	expect(pluginAfterSetup.id).toBe("samuelstroschein.inlangPluginJson")
})

it("should be able to import an inlang plugin from http", async () => {
	// using a permalink to an inlang plugin
	const { default: plugin } = await $import(
		"https://raw.githubusercontent.com/samuelstroschein/inlang-plugin-json/3e322bf01763fc6d8c9f9f9489be889ae96ca6f2/dist/index.js",
	)
	const pluginAfterSetup = plugin()
	expect(pluginAfterSetup.id).toBe("samuelstroschein.inlangPluginJson")
})
