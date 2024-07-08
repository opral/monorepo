import { describe, it, expect } from "vitest"
import { connectToLinter } from "./host.js"
import { openRepository } from "@lix-js/client"
import { createNodeishMemoryFs } from "@lix-js/fs"
import { makeLinterAvailableTo } from "./linter.js"
import { createNewProject } from "../createNewProject.js"
import { loadProject } from "../loadProject2.js"
import type { ProjectSettings2 } from "../types/project-settings.js"
import type { MessageBundle } from "../types/message-bundle.js"
import type { Observable } from "rxjs"
import { replicateRxCollection } from "rxdb/plugins/replication"

const settings: ProjectSettings2 = {
	baseLocale: "en",
	locales: ["en", "de"],
	modules: [],
	lintConfig: [],
}

describe("Lint Worker", () => {
	it("initializes successfully", async () => {
		const fs = createNodeishMemoryFs()

		const projectPath = "/project.inlang"

		const repo = await openRepository("file://", { nodeishFs: fs })
		repo.getFirstCommitHash = async () => "dummy_first_hash"

		await createNewProject({ repo, projectPath, projectSettings: settings })
		const project = await loadProject({
			repo,
			projectPath,
			_lintFactory: async () => ({
				fix: async () => ({} as MessageBundle),
				lint: async () => ({}),
				terminate: () => {},
			}),
		})
		await project.messageBundleCollection.insert({
			id: "dummy_elephant",
			messages: [
				{
					id: "dummy_elephant_en",
					locale: "en",
					declarations: [],
					selectors: [],
					variants: [],
				},
			],
			alias: {},
		})

		await sleep(50)

		const { port1, port2 } = new MessageChannel()

		makeLinterAvailableTo(port2)
		const linter = await connectToLinter(projectPath, settings, fs, port1)
		const result = await linter.lint(settings)

		console.log(result)

		expect(linter.fix).toBeDefined()
		expect(linter.lint).toBeDefined()
	})
})

async function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms)
	})
}
