import { it, expect, afterAll } from "vitest"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"
import { create$import } from "./create$import.js"

const currentDirectoryPath = dirname(fileURLToPath(import.meta.url))
const tempdir = fs.mkdtempSync(currentDirectoryPath)

const $import = create$import(currentDirectoryPath)

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
	expect(module.default()).toBe("Inlang")
	expect(module.hello("World")).toBe("Hello World")
})

it("should throw if the imported file is invalid", async () => {
	fs.writeFileSync(`${tempdir}/testfile2.js`, `export invalid function name()`, {
		encoding: "utf8",
	})
	expect($import(`${tempdir}/testfile2.js`)).rejects.toThrow()
})

it("should be able to import an inlang plugin from a relative path", async () => {
	const module = await $import(`./$import.test.plugin.js`)
	const pluginAfterSetup = module.default()()
	expect(pluginAfterSetup.id).toBe("samuelstroschein.inlangPluginJson")
})

it("should be able to import an inlang plugin from an absolute path", async () => {
	const module = await $import(`${currentDirectoryPath}/$import.test.plugin.js`)
	const pluginAfterSetup = module.default()()
	expect(pluginAfterSetup.id).toBe("samuelstroschein.inlangPluginJson")
})

it("should be able to import an inlang plugin from http", async () => {
	// using a permalink to an inlang plugin
	const module = await $import(
		"https://raw.githubusercontent.com/samuelstroschein/inlang-plugin-json/3e322bf01763fc6d8c9f9f9489be889ae96ca6f2/dist/index.js",
	)
	const pluginAfterSetup = module.default()()
	expect(pluginAfterSetup.id).toBe("samuelstroschein.inlangPluginJson")
})
