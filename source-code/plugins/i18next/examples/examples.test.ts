import { expect } from "vitest"
import { mockEnvironment } from "@inlang/core/test"
import { setupConfig } from "@inlang/core/config"
import fs from "node:fs/promises"
import { it, describe } from "vitest"

const thisDirectoryPath = new URL("./", import.meta.url).pathname

const exampleDirectories = (await fs.readdir(thisDirectoryPath)).filter(
	// filtering the test file
	(dir) => dir !== "examples.test.ts",
)

describe("examples", () => {
	for (const exampleDir of exampleDirectories) {
		// setup config also validates the config with a few tests
		it(`${exampleDir} inlang's setup config should pass`, async () => {
			const env = await mockEnvironment({
				copyDirectory: {
					fs: fs,
					paths: ["./dist", `./examples/${exampleDir}`],
				},
			})

			const module = await import(`./${exampleDir}/inlang.config.js`)
			const config = await setupConfig({ module, env })

			expect(config).toBeDefined()
		})
	}
})
