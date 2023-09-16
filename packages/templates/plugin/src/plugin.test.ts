import { it, expect } from "vitest"
import { ProjectSettings, loadProject } from "@inlang/sdk"
import { createNodeishMemoryFs } from "@inlang/sdk/test-utilities"
import { id as pluginId } from "../marketplace-manifest.json"

it("should return fake messages to illustrate how a plugin works", async () => {
	// creating a virtual filesystem to store the project file
	const fs = createNodeishMemoryFs()

	// creating a project file
	const settings = {
		sourceLanguageTag: "en",
		modules: ["./plugin.js"],
		languageTags: ["en", "de"],
	} satisfies ProjectSettings

	// writing the project file to the virtual filesystem
	await fs.writeFile("/project.inlang.json", JSON.stringify(settings))

	// opening the project file and loading the plugin
	const inlang = await loadProject({
		nodeishFs: fs,
		settingsFilePath: "/project.inlang.json",
		// simulate the import function that the SDK uses
		// to inject the plugin into the project
		_import: async () => import("./index.js"),
	})

	expect(inlang.errors()).toEqual([])

	expect(inlang.installed.plugins()[0]?.meta.id).toBe(pluginId)

	expect(inlang.query.messages.get({ where: { id: "this-is-a-test-message" } })).toBeDefined()
})
