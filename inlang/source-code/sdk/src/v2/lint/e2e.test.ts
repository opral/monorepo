import { describe, it, expect } from "vitest"
import { connectToLinter } from "./host.js"
import { openRepository } from "@lix-js/client"
import { createNodeishMemoryFs } from "@lix-js/fs"
import { makeLinterAvailableTo } from "./linter.js"
import { createNewProject } from "../createNewProject.js"
import { loadProject } from "../loadProject2.js"
import type { ProjectSettings2 } from "../types/project-settings.js"
import type { MessageBundle } from "../types/message-bundle.js"

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

		await project.internal.bundleStorage.insert({
			id: "happy_elephant",
			alias: {},
		})

		await project.internal.messageStorage.insert({
			id: "happy_elephant_en",
			bundleId: "happy_elephant",
			locale: "en",
			variants: [],
			selectors: [],
			declarations: [],
		})

		const messages = project.messageBundleCollection.find()
		console.log("messages", messages)

		const { port1, port2 } = new MessageChannel()
		/*
		makeLinterAvailableTo(port2)
		const linter = await connectToLinter(projectPath, settings, fs, port1)

		expect(linter.fix).toBeDefined()
		expect(linter.lint).toBeDefined()
        */
	})
})
