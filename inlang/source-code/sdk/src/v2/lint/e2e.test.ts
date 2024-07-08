import { describe, it, expect } from "vitest"
import { connectToLinter } from "./host.js"
import { defaultProjectSettings } from "../defaultProjectSettings.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import { makeLinterAvailableTo } from "./linter.js"
import { createNewProject } from "../createNewProject.js"
import { openRepository } from "@lix-js/client"

describe("Lint Worker", () => {
	it("initializes successfully", async () => {
		const { port1, port2 } = new MessageChannel()
		const fs = createNodeishMemoryFs()

		const repo = await openRepository("/", { nodeishFs: fs })
		await createNewProject({ repo, projectPath: "/project.inlang" })

		makeLinterAvailableTo(port2)
		const linter = await connectToLinter("/project.inlang", defaultProjectSettings, fs, port1)

		expect(linter.fix).toBeDefined()
		expect(linter.lint).toBeDefined()
	})
})
