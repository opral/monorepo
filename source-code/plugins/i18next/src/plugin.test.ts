import { mockEnvironment } from "@inlang/core/test"
import { expect, it } from "vitest"
import { plugin } from "./plugin.js"

it("should throw if the path pattern does not include the {language} placeholder", async () => {
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", "{}")
	const x = plugin({ pathPattern: "./resources/" })(env)
	try {
		await x.config({})
		throw new Error("should not reach this")
	} catch (e) {
		expect((e as Error).message).toContain("pathPattern")
	}
})

it("should not throw if the path pattern is valid", async () => {
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", "{}")
	const x = plugin({ pathPattern: "./{language}.json" })(env)
	expect(await x.config({})).toBeTruthy()
})

it("should work with empty json files", async () => {
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", "{}")
	const x = plugin({ pathPattern: "./{language}.json" })(env)
	const config = await x.config({})
	expect(
		config.readResources!({
			config: {
				referenceLanguage: "en",
				languages: ["en"],
			} as any,
		}),
	).resolves.toBeTruthy()
})

it("should work with not yet existing files", async () => {
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", "{}")
	const x = plugin({ pathPattern: "./{language}.json" })(env)
	const config = await x.config({})
	expect(
		config.readResources!({
			config: {
				referenceLanguage: "en",
				languages: ["en", "de"],
			} as any,
		}),
	).resolves.toBeTruthy()
})

it("should preserve the spacing resources and determine a default based on the majority for newly added resources", async () => {
	// @prettier-ignore
	const with4Spaces = `{
    "test": "test"
}`

	// @prettier-ignore
	const withTabs = `{
	"test": "test"
}`

	const env = await mockEnvironment({})

	await env.$fs.writeFile("./en.json", with4Spaces)
	await env.$fs.writeFile("./fr.json", with4Spaces)
	await env.$fs.writeFile("./de.json", withTabs)

	const x = plugin({ pathPattern: "./{language}.json" })(env)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en", "de", "fr"]

	const resources = await config.readResources!({
		config: config as any,
	})

	resources.push({
		type: "Resource",
		languageTag: {
			type: "LanguageTag",
			name: "es",
		},
		body: [
			{
				type: "Message",
				id: {
					type: "Identifier",
					name: "test",
				},
				pattern: {
					type: "Pattern",
					elements: [
						{
							type: "Text",
							value: "test",
						},
					],
				},
			},
		],
	})

	await config.writeResources!({
		config: config as any,
		resources,
	})

	const file1 = await env.$fs.readFile("./en.json", { encoding: "utf-8" })
	const file2 = await env.$fs.readFile("./fr.json", { encoding: "utf-8" })
	const file3 = await env.$fs.readFile("./de.json", { encoding: "utf-8" })
	const file4 = await env.$fs.readFile("./es.json", { encoding: "utf-8" })

	expect(file1).toBe(with4Spaces)
	expect(file2).toBe(with4Spaces)
	expect(file3).toBe(withTabs)
	expect(file4).toBe(with4Spaces)
})
