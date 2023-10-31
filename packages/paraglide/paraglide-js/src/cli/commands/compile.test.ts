import consola from "consola"
import { vi, test, expect, beforeEach } from "vitest"
import memfs from "memfs"
import mockedFs from "node:fs/promises"
import fs from "node:fs"
import { compileCommand } from "./compile.js"
import type { ProjectSettings } from "@inlang/sdk"
import { createMessage } from "@inlang/sdk/test-utilities"
import { resolve } from "node:path"
import { _setStateForTest } from "../state.js"

beforeEach(() => {
	vi.resetAllMocks()
	// Re-mock consola before each test call to remove calls from before
	consola.mockTypes(() => vi.fn())

	// set the current working directory to some mock value to prevent
	// the tests from failing when running in a different environment
	process.cwd = () => "/"

	// spy on commonly used functions to prevent console output
	// and allow expecations
	vi.spyOn(consola, "log").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "info").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "success").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "error").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "warn").mockImplementation(() => undefined as never)
	vi.spyOn(process, "exit").mockImplementation(() => {
		throw "PROCESS.EXIT()"
	})
})

test("it should exit if the project has errors", async () => {
	mockFs({
		"/project.inlang.json": JSON.stringify({
			// invalid source language tag
			sourceLanguageTag: "en-EN-EN",
			languageTags: [],
			modules: [],
		} satisfies ProjectSettings),
	})

	expect(
		compileCommand.parseAsync(["--project", "./project.inlang.json", "--namespace", "frontend"])
	).rejects.toEqual("PROCESS.EXIT()")
})

test("it should compile a project with a namespace", async () => {
	const name = "frontend"

	_setStateForTest({ paraglideDirectory: "/node_modules/paraglide-js" })
	const _fs = mockFs({
		"/plugin.js": fs.readFileSync(
			// using the inlang-message-format plugin
			resolve(__dirname, "../../../../../plugins/inlang-message-format/dist/index.js"),
			{ encoding: "utf-8" }
		),
		"/project.inlang.json": JSON.stringify({
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["/plugin.js"],
			"plugin.inlang.messageFormat": {
				filePath: "/messages.json",
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
	await compileCommand.parseAsync(["--project", "./project.inlang.json", "--namespace", name])
	expect(
		_fs.existsSync(`/node_modules/paraglide-js/dist/compiled-output/${name}/messages.js`)
	).toBe(true)
})

const mockFs = (files: memfs.DirectoryJSON) => {
	const _memfs = memfs.createFsFromVolume(memfs.Volume.fromJSON(files))
	for (const prop in mockedFs) {
		// @ts-ignore - memfs has the same interface as node:fs/promises
		if (typeof mockedFs[prop] !== "function") continue
		// @ts-ignore - memfs has the same interface as node:fs/promises
		vi.spyOn(mockedFs, prop).mockImplementation(_memfs.promises[prop])
	}
	return _memfs
}
