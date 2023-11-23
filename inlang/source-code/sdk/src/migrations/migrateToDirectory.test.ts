import { test, expect, vi } from "vitest"
import { migrateToDirectory } from "./migrateToDirectory.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import type { ProjectSettings } from "@inlang/project-settings"

test("it should return if the settings file has an error (let loadProject handle it)", async () => {
	const settingsFilePath = "./project.inlang.json"
	const mockFs = {
		readFile: vi.fn(() => {
			throw Error()
		}),
	}
	expect(() => migrateToDirectory({ fs: mockFs as any, settingsFilePath })).not.toThrow()
	expect(mockFs.readFile).toHaveBeenCalled()
})

test("it should create the project directory if it does not exist", async () => {
	const settingsFilePath = "./project.inlang.json"
	const mockFs = {
		readFile: vi.fn(() => "{}"),
		stat: vi.fn(() => {
			throw Error()
		}),
		mkdir: vi.fn(),
		writeFile: vi.fn(),
	}
	await migrateToDirectory({ fs: mockFs as any, settingsFilePath })
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
	await migrateToDirectory({ fs, settingsFilePath: "./project.inlang.json" })
	const migratedSettingsFile = await fs.readFile("./project.inlang/settings.json", {
		encoding: "utf-8",
	})
	expect(migratedSettingsFile).toEqual(JSON.stringify(mockSettings))
	expect(await fs.stat("./project.inlang.README.md")).toBeDefined()
})
