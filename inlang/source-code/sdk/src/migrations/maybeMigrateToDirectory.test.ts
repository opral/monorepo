import { test, expect, vi } from "vitest"
import { maybeMigrateToDirectory } from "./maybeMigrateToDirectory.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import type { ProjectSettings } from "@inlang/project-settings"

test("it should return if the project path does not end with .inlang.json (has already been migrated)", async () => {
	const projectPath = "./project.inlang"
	const mockFs = {
		readFile: vi.fn(),
	}
	await maybeMigrateToDirectory({ fs: mockFs as any, projectPath })
	expect(mockFs.readFile).not.toHaveBeenCalled()
})

test("it should return if the settings file has an error (let loadProject handle it)", async () => {
	const projectPath = "./project.inlang.json"
	const mockFs = {
		readFile: vi.fn(() => {
			throw Error()
		}),
	}
	expect(() => maybeMigrateToDirectory({ fs: mockFs as any, projectPath })).not.toThrow()
	expect(mockFs.readFile).toHaveBeenCalled()
})

test("it should create the project directory if it does not exist", async () => {
	const projectPath = "./project.inlang.json"
	const mockFs = {
		readFile: vi.fn(() => "{}"),
		stat: vi.fn(() => {
			throw Error()
		}),
		mkdir: vi.fn(),
		writeFile: vi.fn(),
	}
	await maybeMigrateToDirectory({ fs: mockFs as any, projectPath })
	expect(mockFs.mkdir).toHaveBeenCalled()
})

test("it should write the settings file to the new path", async () => {
	const fs = createNodeishMemoryFs()
	const mockSettings: ProjectSettings = {
		sourceLanguageTag: "en",
		languageTags: ["en", "de"],
		modules: [],
	}
	await fs.writeFile("./project.inlang.json", JSON.stringify(mockSettings))
	await maybeMigrateToDirectory({ fs, projectPath: "./project.inlang.json" })
	const migratedSettingsFile = await fs.readFile("./project.inlang/settings.json", {
		encoding: "utf-8",
	})
	expect(migratedSettingsFile).toEqual(JSON.stringify(mockSettings))
	expect(await fs.stat("./project.inlang.README.md")).toBeDefined()
})
