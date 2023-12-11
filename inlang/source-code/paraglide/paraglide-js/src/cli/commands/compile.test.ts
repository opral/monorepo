import { vi, test, expect, beforeEach } from "vitest"
import memfs from "memfs"
import mockedFs from "node:fs/promises"
import fs from "node:fs"
import { compileCommand } from "./compile.js"
import type { ProjectSettings } from "@inlang/sdk"
import { createMessage, createNodeishMemoryFs } from "@inlang/sdk/test-utilities"
import { resolve } from "node:path"
import { Logger } from "../../services/logger/index.js"

beforeEach(() => {
	vi.resetAllMocks()
	// set the current working directory to some mock value to prevent
	// the tests from failing when running in a different environment
	process.cwd = () => "/"

	// spy on commonly used functions to prevent console output
	// and allow expecations
	vi.spyOn(Logger.prototype, "ln").mockImplementation(() => Logger.prototype)
	vi.spyOn(Logger.prototype, "info").mockImplementation(() => Logger.prototype)
	vi.spyOn(Logger.prototype, "success").mockImplementation(() => Logger.prototype)
	vi.spyOn(Logger.prototype, "warn").mockImplementation(() => Logger.prototype)
	vi.spyOn(Logger.prototype, "error").mockImplementation(() => Logger.prototype)
	vi.spyOn(process, "exit").mockImplementation((e) => {
		console.error(`PROCESS.EXIT()`, e)
		throw "PROCESS.EXIT()"
	})
})

test("it should exit if the project has errors", async () => {
	mockFs({
		"/project.inlang/settings.json": JSON.stringify({
			// invalid source language tag
			sourceLanguageTag: "en-EN-EN",
			languageTags: [],
			modules: [],
		} satisfies ProjectSettings),
	})

	expect(compileCommand.parseAsync(["--project", "./project.inlang"])).rejects.toEqual(
		"PROCESS.EXIT()"
	)
})

test("it should compile into the default outdir", async () => {
	const _fs = mockFs({
		"/plugin.js": fs.readFileSync(
			// using the inlang-message-format plugin
			resolve(__dirname, "../../../../../plugins/inlang-message-format/dist/index.js"),
			{ encoding: "utf-8" }
		),
		"/project.inlang/settings.json": JSON.stringify({
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["/plugin.js"],
			"plugin.inlang.messageFormat": {
				pathPattern: "/messages/{languageTag}.json",
			},
		} satisfies ProjectSettings),
		"/messages.json": JSON.stringify({
			$schema: "https://inlang.com/schema/inlang-message-format",
			data: [
				createMessage("loginButton", {
					en: "Login",
					de: "Anmelden",
				}),
			],
		}),
	})

	// I have no idea why, but the { from: "user" } is required for the test to pass
	await compileCommand.parseAsync(["--project", "./project.inlang"], { from: "user" })
	expect(_fs.existsSync("./src/paraglide/messages.js")).toBe(true)
})

test.only("it should compile a project into the provided outdir", async () => {
	const outdirs = ["/paraglide-js", "./paraglide-js", "/src/paraglide-js", "./src/paraglide-js"]

	const _fs = mockFs({
		"/plugin.js": fs.readFileSync(
			// using the inlang-message-format plugin
			resolve(__dirname, "../../../../../plugins/inlang-message-format/dist/index.js"),
			{ encoding: "utf-8" }
		),
		"/project.inlang/settings.json": JSON.stringify({
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["/plugin.js"],
			"plugin.inlang.messageFormat": {
				pathPattern: "/messages/{languageTag}.json",
			},
		} satisfies ProjectSettings),
		"/messages.json": JSON.stringify({
			$schema: "https://inlang.com/schema/inlang-message-format",
			data: [
				createMessage("loginButton", {
					en: "Login",
					de: "Anmelden",
				}),
			],
		}),
	})

	for (const outdir of outdirs) {
		// I have no idea why, but the { from: "user" } is required for the test to pass
		await compileCommand.parseAsync(["--project", "./project.inlang", "--outdir", outdir], {
			from: "user",
		})
		expect(_fs.existsSync(`${outdir}/messages.js`)).toBe(true)
	}
})

const mockFs = (files: memfs.DirectoryJSON) => {
	const _memfs = memfs.createFsFromVolume(memfs.Volume.fromJSON(files))
	const lixFs = createNodeishMemoryFs()
	for (const prop in mockedFs) {
		// @ts-ignore - memfs has the same interface as node:fs/promises
		if (typeof mockedFs[prop] !== "function") continue
		// @ts-ignore - memfs dies not have a watch interface - quick fix should be updated
		if (mockedFs[prop].name === "watch") {
			// @ts-ignore - memfs has the same interface as node:fs/promises
			vi.spyOn(mockedFs, prop).mockImplementation(lixFs[prop])
		} else {
			// @ts-ignore - memfs has the same interface as node:fs/promises
			vi.spyOn(mockedFs, prop).mockImplementation(_memfs.promises[prop])
		}
	}
	return _memfs
}
