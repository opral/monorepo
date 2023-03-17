import { Volume } from "memfs"
import { describe, expect, it } from "vitest"
import { mockEnvironment } from "@inlang/core/test"
import { _generateConfigFile } from "./generateConfigFile.js"
import { _queryChatGPT } from "./generateConfigFile.server.js"

// skipping tests due to costs of invoking the openai api
describe("generating config files", () => {
	it(
		"should generate a config file for a simple json project",
		async () => {
			const fs = Volume.fromJSON({
				"locales/en.json": JSON.stringify({ hello: "hello from en" }),
				"locales/fr.json": JSON.stringify({ hello: "bonjour via fr" }),
				"locales/de.json": JSON.stringify({ hello: "hallo von de" }),
				"locales/utils.js": JSON.stringify("jibberish"),
				"main.js": "export function hello() { return 'hello' }",
			})
			const env = await mockEnvironment({ copyDirectory: { fs: fs.promises, path: "/" } })
			// @ts-ignore
			const result = await _generateConfigFile({ env, queryChatGpt: _queryChatGPT })
			if (result.isErr) {
				console.log(result.error)
			}
			expect(result.isOk).toBe(true)
		},
		{ timeout: 50000 },
	)

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
			// @ts-ignore
			const result = await _generateConfigFile({ env, queryChatGpt: _queryChatGPT })
			if (result.isErr) {
				console.log(result.error)
			}
			expect(result.isOk).toBe(true)
		},
		{ timeout: 50000 },
	)
})
