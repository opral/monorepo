import { Volume } from "memfs"
import { describe, expect, it } from "vitest"
import { mockEnvironment } from "@inlang/core/test"
import { generateConfigFile } from "@inlang/shared/openai"

// skipping tests due to costs of invoking the openai api
describe("generating config files", () => {
	it(
		"should generate a config file for a complex json project",
		async () => {
			const fs = Volume.fromJSON({
				"i18n/en/base.json": JSON.stringify({ hello: "hello from en" }),
				"i18n/fr/base.json": JSON.stringify({ hello: "hello from fr" }),
				"i18n/de/base.json": JSON.stringify({ hello: "hello from de" }),
				"i18n/utils.js": JSON.stringify("jibberish"),
				"package.json": "{}",
				"src/entry.js": "export function hello() { return 'hello' }",
				"main.js": "export function hello() { return 'hello' }",
			})
			const env = await mockEnvironment({ copyDirectory: { fs: fs.promises, path: "/" } })
			const result = await generateConfigFile({ fs: env.$fs, path: "./" })
			if (result.isErr) {
				console.log(result.error)
			}
			expect(result.isOk).toBe(true)
		},
		{ timeout: 50000 },
	)
})
