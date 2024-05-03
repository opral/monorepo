import { vi, it, describe, expect, beforeEach, afterEach } from "vitest"
import fs from "node:fs/promises"
import os from "node:os"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { ProjectSettings } from "@inlang/sdk"
import { getInlangProject } from "./getInlangProject.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// mocks
process.exit = vi.fn()
console.error = vi.fn()

beforeEach(async () => {
	vi.resetAllMocks()
	// mock cwd to a unique temp dir
	// https://nodejs.org/docs/latest-v20.x/api/fs.html#fspromisesmkdtempprefix-options
	const cwd = await fs.mkdtemp(join(os.tmpdir(), "test-cli-getInlangProject-"))
	process.cwd = () => cwd
})

afterEach(async () => {
	const cwd = process.cwd()
	// cleanup temp dir carefully
	if (cwd.startsWith(os.tmpdir())) {
		await fs.rm(cwd, { recursive: true })
	}
})

const pluginPath = resolve(__dirname, "../../../plugins/inlang-message-format/dist/index.js")

const settings = {
	sourceLanguageTag: "en",
	languageTags: ["en", "de"],
	modules: [pluginPath],
	"plugin.inlang.messageFormat": {
		pathPattern: "./locales/{languageTag}.json",
	},
} satisfies ProjectSettings

describe(
	"getInlangProject",
	() => {
		it("does not error in a project with no git repo", async () => {
			// process.cwd() is mocked to a temp dir
			const projectPath = join(process.cwd(), "project.inlang")
			await fs.mkdir(projectPath)

			const settingsPath = join(projectPath, "settings.json")
			await fs.writeFile(settingsPath, JSON.stringify(settings))

			await getInlangProject({ projectPath: "project.inlang" })

			expect(process.exit).not.toHaveBeenCalled()
			expect(console.error).toHaveBeenCalledTimes(1)
			expect(console.error).toHaveBeenCalledWith(
				`Could not find repository root for path ${projectPath}, falling back to direct fs access`
			)
		})
	},
	{ timeout: 10000 }
)
