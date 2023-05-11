import { describe, expect, it } from "vitest"
import { generateConfigFileServer } from "./generateConfigFile.js"

// skipping tests due to costs of invoking the openai api
describe.skip("generating config files", () => {
	it(
		"should generate a config file for a simple json project",
		async () => {
			const filesystemAsJson = {
				"locales/en.json": btoa(JSON.stringify({ hello: "hello from en" })),
				"locales/fr.json": btoa(JSON.stringify({ hello: "bonjour via fr" })),
				"locales/de.json": btoa(JSON.stringify({ hello: "hallo von de" })),
				"locales/utils.js": btoa(JSON.stringify("jibberish")),
				"main.js": btoa("export function hello() { return 'hello' }"),
			}
			const [file, exception] = await generateConfigFileServer({
				filesystemAsJson,
			})
			if (exception) {
				console.error(exception)
				console.log(file)
			}
			expect(exception).toBeUndefined()
		},
		{ timeout: 100000 },
	)

	it(
		"should generate a config file for a complex json project",
		async () => {
			const filesystemAsJson = {
				"/i18n/en/base.json": btoa(JSON.stringify({ hello: "hello from en" })),
				"/i18n/fr/base.json": btoa(JSON.stringify({ hello: "hello from fr" })),
				"/i18n/de/base.json": btoa(JSON.stringify({ hello: "hello from de" })),
				"/i18n/utils.js": btoa(JSON.stringify("jibberish")),
				"/package.json": btoa("{}"),
				"/src/entry.js": btoa("export function hello() { return 'hello' }"),
				"/main.js": btoa("export function hello() { return 'hello' }"),
			}
			const [file, exception] = await generateConfigFileServer({ filesystemAsJson })
			if (exception) {
				console.error(exception)
				console.log(file)
			}
			expect(exception).toBeUndefined()
		},
		{ timeout: 100000 },
	)

	it(
		"should cancel the request if no config can be generated to minimize costs",
		async () => {
			const filesystemAsJson = {
				"/d/xx.jso3n": JSON.stringify({ hello: "hello from en" }),
				"/ff/ffff.po": "another file format. good luck chat gpt",
			}
			const [, exception] = await generateConfigFileServer({ filesystemAsJson })
			expect(exception).toBeDefined()
		},
		{ timeout: 100000 },
	)
})
