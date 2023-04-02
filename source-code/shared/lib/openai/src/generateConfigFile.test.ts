import { describe, expect, it } from "vitest"
import { _generateConfigFileServer } from "./generateConfigFile.server.js"

// skipping tests due to costs of invoking the openai api
describe.skip("generating config files", () => {
	it(
		"should generate a config file for a simple json project",
		async () => {
			const filesystemAsJson = {
				"locales/en.json": JSON.stringify({ hello: "hello from en" }),
				"locales/fr.json": JSON.stringify({ hello: "bonjour via fr" }),
				"locales/de.json": JSON.stringify({ hello: "hallo von de" }),
				"locales/utils.js": JSON.stringify("jibberish"),
				"main.js": "export function hello() { return 'hello' }",
			}
			const [, exception] = await _generateConfigFileServer({ filesystemAsJson })
			if (exception) {
				console.log(exception)
			}
			expect(exception).toBeUndefined()
		},
		{ timeout: 50000 },
	)

	it(
		"should generate a config file for a complex json project",
		async () => {
			const filesystemAsJson = {
				"i18n/en/base.json": JSON.stringify({ hello: "hello from en" }),
				"i18n/fr/base.json": JSON.stringify({ hello: "hello from fr" }),
				"i18n/de/base.json": JSON.stringify({ hello: "hello from de" }),
				"i18n/utils.js": JSON.stringify("jibberish"),
				"package.json": "{}",
				"src/entry.js": "export function hello() { return 'hello' }",
				"main.js": "export function hello() { return 'hello' }",
			}
			const [, exception] = await _generateConfigFileServer({ filesystemAsJson })
			if (exception) {
				console.log(exception)
			}
			expect(exception).toBeUndefined()
		},
		{ timeout: 50000 },
	)

	it(
		"should cancel the request if no config can be generated to minimize costs",
		async () => {
			const filesystemAsJson = {
				"d/xx.jso3n": JSON.stringify({ hello: "hello from en" }),
				"ff/ffff.po": "another file format. good luck chat gpt",
			}
			const [, exception] = await _generateConfigFileServer({ filesystemAsJson })
			expect(exception).toBe(true)
			expect(exception!.message).toBe("Couldn't generate a config file.")
		},
		{ timeout: 50000 },
	)
})
