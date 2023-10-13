import { it, expect, afterAll, vi } from "vitest"
import fs from "node:fs"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"
import { _import as __import } from "./_import.js"

const currentDirectoryPath = dirname(fileURLToPath(import.meta.url))
const tempdir = fs.mkdtempSync(currentDirectoryPath)
const _import = __import(currentDirectoryPath)

vi.mock("vscode", () => {
	return {
		workspace: {
			getConfiguration: () => ({
				get: vi.fn().mockReturnValue(process.env.HTTPS_PROXY || ""),
			}),
		},
	}
})

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
		{ encoding: "utf8" }
	)
	const module = await _import(`${tempdir}/testfile1.js`)
	expect(module.default()).toBe("Inlang")
	expect(module.hello("World")).toBe("Hello World")
})

it("should throw if the imported file is invalid", async () => {
	fs.writeFileSync(`${tempdir}/testfile2.js`, `export invalid function name()`, {
		encoding: "utf8",
	})
	expect(_import(`${tempdir}/testfile2.js`)).rejects.toThrow()
})

it("should be able to import an inlang plugin from a relative path", async () => {
	const module = await _import(`./_import.test.plugin.js`)
	const pluginAfterSetup = module.default()()
	expect(pluginAfterSetup.id).toBe("samuelstroschein.inlangPluginJson")
})

it("should be able to import an inlang plugin from an absolute path", async () => {
	const module = await _import(`${currentDirectoryPath}/_import.test.plugin.js`)
	const pluginAfterSetup = module.default()()
	expect(pluginAfterSetup.id).toBe("samuelstroschein.inlangPluginJson")
})

it("should be able to import an inlang plugin from http", async () => {
	// using a permalink to an inlang plugin
	const module = await _import(
		"https://raw.githubusercontent.com/samuelstroschein/inlang-plugin-json/3e322bf01763fc6d8c9f9f9489be889ae96ca6f2/dist/index.js"
	)
	const pluginAfterSetup = module.default()()
	expect(pluginAfterSetup.id).toBe("samuelstroschein.inlangPluginJson")
})

it("shouldn't be able to import an inlang plugin from http without working proxy", async () => {
	vi.stubEnv("HTTPS_PROXY", "https://inlang-is-not-a-proxy.com:1337")

	// using a permalink to an inlang plugin
	await expect(
		_import(
			"https://raw.githubusercontent.com/samuelstroschein/inlang-plugin-json/3e322bf01763fc6d8c9f9f9489be889ae96ca6f2/dist/index.js"
		)
	).rejects.toThrowErrorMatchingInlineSnapshot(
		'"request to https://raw.githubusercontent.com/samuelstroschein/inlang-plugin-json/3e322bf01763fc6d8c9f9f9489be889ae96ca6f2/dist/index.js failed, reason: getaddrinfo ENOTFOUND inlang-is-not-a-proxy.com"'
	)
})
