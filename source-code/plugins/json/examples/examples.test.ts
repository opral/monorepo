import { expect } from "vitest"
import { createMockEnvironment, InlangConfig } from "@inlang/plugin"
import { plugin } from "../src/plugin.js"
import fs from "node:fs/promises"
import { fileURLToPath } from "node:url"
import { dirname } from "node:path"
import { it, describe } from "vitest"

const thisDirectoryPath = dirname(fileURLToPath(import.meta.url))

const exampleDirectories = (await fs.readdir(thisDirectoryPath)).filter(
	// filtering the test file
	(dir) => dir !== "examples.test.ts",
)

describe("examples", () => {
	for (const exampleDir of exampleDirectories) {
		// setup config also validates the config with a few tests
		it(`${exampleDir} inlang's setup config should pass`, async () => {
			const env = await createMockEnvironment({
				copyDirectory: {
					fs: fs,
					paths: ["./dist", `./examples/${exampleDir}`],
				},
			})

			let error = undefined

			try {
				const config = JSON.parse(
					await env.$fs.readFile(`./examples/${exampleDir}/inlang.config.json`, {
						encoding: "utf-8",
					}),
				) as InlangConfig
				const options = config.settings.plugins["inlang.plugin-json"].options
				plugin.setup({ fs: env.$fs, options: options })
				const messages = await plugin.loadMessages({
					languageTags: config.languageTags,
				})
				await plugin.saveMessages({ messages: messages })
			} catch (e) {
				error = e
			}

			expect(error).toBe(undefined)
		})
	}
})
