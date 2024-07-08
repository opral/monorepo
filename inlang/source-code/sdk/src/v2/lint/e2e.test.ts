import { describe, it, expect } from "vitest"
import { connectToLinter } from "./host.js"
import { defaultProjectSettings } from "../defaultProjectSettings.js"
import { createNodeishMemoryFs } from "@lix-js/fs"

describe("Lint Worker", () => {
	it("initializes successfully", async () => {
		const { port1, port2 } = new MessageChannel()

		const fs = createNodeishMemoryFs()
		const linter = await connectToLinter("/porject.inlang", defaultProjectSettings, fs, port1)
	})
})
