import { vi, it, describe, expect, beforeEach } from "vitest"
import fs from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { ProjectSettings } from "@inlang/sdk"
import { getInlangProject } from "./getInlangProject.js"

process.cwd = tmpdir
process.exit = vi.fn()
console.error = vi.fn()

beforeEach(() => {
	vi.resetAllMocks()
})

const settings = {
	$schema: "https://inlang.com/schema/project-settings",
	sourceLanguageTag: "en",
	languageTags: ["en", "de"],
	modules: ["https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js"],
	"plugin.inlang.messageFormat": {
		pathPattern: "./locales/{languageTag}.json",
	},
} satisfies ProjectSettings

describe(
	"getInlangProject",
	() => {
		it("does not error in a project with no git repo", async () => {
			const projectPath = join(
				await fs.mkdtemp(join(tmpdir(), "test-getInlangProject")),
				"project.inlang"
			)
			const settingsPath = join(projectPath, "settings.json")
			await fs.mkdir(projectPath)
			await fs.writeFile(settingsPath, JSON.stringify(settings))

			await getInlangProject({ projectPath })

			expect(process.exit).not.toHaveBeenCalled()
			expect(console.error).toHaveBeenCalledTimes(1)
			expect(console.error).toHaveBeenCalledWith(
				`Could not find repository root for path ${projectPath}, falling back to direct fs access`
			)
		})
	},
	{ timeout: 10000 }
)
