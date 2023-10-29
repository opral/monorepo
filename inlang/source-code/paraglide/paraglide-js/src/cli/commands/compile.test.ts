import consola from "consola"
import { beforeAll, vi, test, expect, beforeEach } from "vitest"
import memfs from "memfs"
import fs from "node:fs/promises"
import { compileCommand } from "./compile.js"
import type { ProjectSettings } from "@inlang/sdk"
import { resolve } from "node:path"

beforeAll(() => {
	// spy on commonly used functions to prevent console output
	// and allow expecations
	vi.spyOn(consola, "log").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "info").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "success").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "error").mockImplementation(() => undefined as never)
	vi.spyOn(consola, "warn").mockImplementation(() => undefined as never)
})

beforeEach(() => {
	vi.resetAllMocks()
	// Re-mock consola before each test call to remove calls from before
	consola.mockTypes(() => vi.fn())

	// set the current working directory to some mock value to prevent
	// the tests from failing when running in a different environment
	process.cwd = () => "/"
})

test("it should exit if the project has errors", async () => {
	vi.spyOn(process, "exit").mockImplementation(() => {
		throw "EXIT"
	})
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
	).rejects.toEqual("EXIT")
})

test("it should compile the project", async () => {
	mockFs({
		"/project.inlang.json": JSON.stringify({
			sourceLanguageTag: "en",
			languageTags: ["de"],
			modules: [
        "../"
      ],
		} satisfies ProjectSettings),
		"/frontend": {
			"messages.inlang.json": JSON.stringify({
				"test.message": {
					en: "Hello",
					de: "Hallo",
				},
			}),
		},
	})

	await compileCommand.parseAsync(["--project", "./project.inlang.json", "--namespace", "frontend"])
})

const mockFs = (files: memfs.NestedDirectoryJSON) => {
	const _memfs = memfs.createFsFromVolume(memfs.Volume.fromNestedJSON(files))
	for (const prop in fs) {
		// @ts-ignore - memfs has the same interface as node:fs/promises
		if (typeof fs[prop] !== "function") continue
		// @ts-ignore - memfs has the same interface as node:fs/promises
		vi.spyOn(fs, prop).mockImplementation(_memfs.promises[prop])
	}
	return _memfs
}
