import { it, expect } from "vitest"
import { ProjectSettings, loadProject } from "@inlang/sdk"
import { id as pluginId } from "../marketplace-manifest.json"
import { mockRepo } from "@lix-js/client"

it("should return fake messages to illustrate how a plugin works", async () => {
	// creating a virtual filesystem in a mock repo to store the project file
	const repo = await mockRepo()
	const fs = repo.nodeishFs

	// creating a project file
	const settings = {
		sourceLanguageTag: "en",
		modules: ["./plugin.js"],
		languageTags: ["en", "de"],
	} satisfies ProjectSettings

	// writing the project file to the virtual filesystem
	await fs.mkdir("/project.inlang", { recursive: true })
	await fs.writeFile("/project.inlang/settings.json", JSON.stringify(settings))

	// opening the project file and loading the plugin
	const project = await loadProject({
		repo,
		projectPath: "/project.inlang",
		// simulate the import function that the SDK uses
		// to inject the plugin into the project
		_import: async () => import("./index.js"),
	})

	expect(project.errors()).toEqual([])

	expect(project.installed.plugins()[0]?.id).toBe(pluginId)

	expect(project.query.messages.get({ where: { id: "this-is-a-test-message" } })).toBeDefined()
})
