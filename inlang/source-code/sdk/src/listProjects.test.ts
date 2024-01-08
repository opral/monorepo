import { assert, describe, it } from "vitest"
import { listProjects } from "./listProjects.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import type { ProjectSettings } from "@inlang/project-settings"
import { mockRepo, ciTestRepo } from "@lix-js/client"

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
	it("should find all projects a given path", async () => {
		const fs = createNodeishMemoryFs()
		await fs.mkdir("/user/dir1/project.inlang", { recursive: true })
		await fs.writeFile("/user/dir1/project.inlang/settings.json", JSON.stringify(settings))
		await fs.mkdir("/user/dir2/project.inlang", { recursive: true })
		await fs.writeFile("/user/dir2/project.inlang/settings.json", JSON.stringify(settings))

		await listProjects(fs, "/user").then((projects) => {
			assert(projects.length === 2)
		})
	})

	it("should return objects inside of an array with the projectPath", async () => {
		const fs = createNodeishMemoryFs()
		await fs.mkdir("/user/dir1/project.inlang", { recursive: true })
		await fs.writeFile("/user/dir1/project.inlang/settings.json", JSON.stringify(settings))
		await fs.mkdir("/user/dir2/project.inlang", { recursive: true })
		await fs.writeFile("/user/dir2/project.inlang/settings.json", JSON.stringify(settings))

		await listProjects(fs, "/user").then((projects) => {
			assert.isTrue(typeof projects[0] === "object")
			assert.isTrue(typeof projects[0]?.projectPath === "string")
		})
	})

	it("should limit the recursion depth to 5", async () => {
		const fs = createNodeishMemoryFs()
		await fs.mkdir("/user/dir1/dir2/dir3/dir4/dir5/dir6/project.inlang", { recursive: true })
		await fs.writeFile(
			"/user/dir1/dir2/dir3/dir4/dir5/dir6/project.inlang/settings.json",
			JSON.stringify(settings)
		)

		await listProjects(fs, "/user").then((projects) => {
			assert(projects.length === 0)
		})
	})

	it("should not crash on broken symlinks as cal.com has", async () => {
		const repo = await mockRepo({ fromSnapshot: ciTestRepo })

		await listProjects(repo.fs, "/").then((projects) => {
			assert(projects.length === 1)
		})
	})

	it("should also find files inside of a dir that ends with *.inlang", async () => {
		const fs = createNodeishMemoryFs()
		await fs.mkdir("/user/dir1/go.inlang", { recursive: true })
		await fs.writeFile("/user/dir1/go.inlang/settings.json", JSON.stringify(settings))
		await fs.mkdir("/user/dir2/flutter.inlang", { recursive: true })
		await fs.writeFile("/user/dir2/flutter.inlang/settings.json", JSON.stringify(settings))

		await listProjects(fs, "/user").then((projects) => {
			assert(projects.length === 2)
		})
	})
})
