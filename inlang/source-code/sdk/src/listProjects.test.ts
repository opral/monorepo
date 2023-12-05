import { assert, describe, it } from "vitest"
import { listProjects } from "./listProjects.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import type { ProjectSettings } from "@inlang/project-settings"

const settings: ProjectSettings = {
	sourceLanguageTag: "en",
	languageTags: ["en"],
	modules: ["plugin.js", "lintRule.js"],
	messageLintRuleLevels: {
		"messageLintRule.project.missingTranslation": "error",
	},
	"plugin.project.i18next": {
		pathPattern: "./examples/example01/{languageTag}.json",
		variableReferencePattern: ["{", "}"],
	},
}

describe("listProjects", () => {
	it("should find all projects in the inlang monorepo", async () => {
		const fs = createNodeishMemoryFs()
		await fs.mkdir("/user/project.inlang", { recursive: true })
		await fs.writeFile("/user/project.inlang/settings.json", JSON.stringify(settings))

		await listProjects(fs, "/user").then((projects) => {
			assert(projects.length === 1)
		})
	})
})
