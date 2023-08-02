import { expect, it, describe } from "vitest"
import { plugin } from "./plugin.js"
import { createMockEnvironment, getVariant, type Variant } from "@inlang/plugin"
import type { PluginOptions } from "./options.js"

describe("plugin options", () => {
	it("should throw if the path pattern does not include the {language} placeholder", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", "{}")
		try {
			plugin.setup({ options: { pathPattern: "./resources/" }, fs: env.$fs })
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})

	it("should throw if the path pattern string does not end with '.json'", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", "{}")
		try {
			plugin.setup({ options: { pathPattern: "./resources/" }, fs: env.$fs })
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})

	it("should throw if the path pattern with namespaces does not include the {language} placeholder", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", "{}")
		try {
			plugin.setup({
				options: {
					pathPattern: {
						common: "./common.json",
					},
				},
				fs: env.$fs,
			})
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})

	it("should throw if the path pattern with namespaces does not end with '.json'", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", "{}")
		try {
			plugin.setup({
				options: {
					pathPattern: {
						common: "./{language}/common",
					},
				},
				fs: env.$fs,
			})
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})

	it("should throw if the path pattern with namespaces has a namespace with a dot", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", "{}")
		try {
			plugin.setup({
				options: {
					pathPattern: {
						"namespaceWith.dot": "./{language}/common.json",
					},
				},
				fs: env.$fs,
			})
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})

	it("should throw if the path pattern includes wildcard", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", "{}")
		try {
			plugin.setup({
				options: {
					pathPattern: "./{language}/*.json",
				},
				fs: env.$fs,
			})
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})
})

describe("loadMessage", () => {
	it("should return messages if the path pattern is valid", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "Hello {{name}} world" }))
		const languageTags = ["en"]
		const options: PluginOptions = {
			pathPattern: "./{language}.json",
		}
		plugin.setup({ options, fs: env.$fs })
		const messages = await plugin.loadMessages!({ languageTags })
		expect(
			(getVariant(messages[0]!, { languageTag: "en" }).data as Variant["pattern"])[0]?.type,
		).toBe("Text")
	})

	it("should work with empty json files", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({}))
		const languageTags = ["en"]
		const options: PluginOptions = {
			pathPattern: "./{language}.json",
		}
		plugin.setup({ options, fs: env.$fs })
		expect(plugin.loadMessages!({ languageTags })).resolves.toBeTruthy()
	})

	it("should work with not yet existing files", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "Hello {{name}} world" }))
		const options: PluginOptions = {
			pathPattern: "./{language}.json",
		}
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en", "de"]
		expect(plugin.loadMessages!({ languageTags })).resolves.toBeTruthy()
	})

	it("should add multible variants to the same message", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "Hello {{name}} world" }))
		await env.$fs.writeFile("./de.json", JSON.stringify({ test: "Hallo {{name}} welt" }))
		const options: PluginOptions = {
			pathPattern: "./{language}.json",
		}
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en", "de"]
		const messages = await plugin.loadMessages!({ languageTags })
		expect(getVariant(messages[0]!, { languageTag: "en" })).toBeTruthy()
		expect(getVariant(messages[0]!, { languageTag: "de" })).toBeTruthy()
	})
})

// it("should work with empty json files", async () => {
// 	const env = await mockEnvironment({})
// 	await env.$fs.writeFile("./en.json", "{}")
// 	const x = plugin({ pathPattern: "./{language}.json" })(env)
// 	const config = await x.config({})
// 	expect(
// 		config.readResources!({
// 			config: {
// 				sourceLanguageTag: "en",
// 				languageTags: ["en"],
// 			} satisfies Partial<InlangConfig> as any,
// 		}),
// 	).resolves.toBeTruthy()
// })

// it("should work with not yet existing files", async () => {
// 	const env = await mockEnvironment({})
// 	await env.$fs.writeFile("./en.json", "{}")
// 	const x = plugin({ pathPattern: "./{language}.json" })(env)
// 	const config = await x.config({})
// 	expect(
// 		config.readResources!({
// 			config: {
// 				sourceLanguageTag: "en",
// 				languageTags: ["en", "de"],
// 			} satisfies Partial<InlangConfig> as any,
// 		}),
// 	).resolves.toBeTruthy()
// })

// it("should preserve the spacing resources and determine a default based on the majority for newly added resources", async () => {
// 	// @prettier-ignore
// 	const with4Spaces = `{
//     "test": "test"
// }`

// 	// @prettier-ignore
// 	const withTabs = `{
// 	"test": "test"
// }`

// 	const env = await mockEnvironment({})

// 	await env.$fs.writeFile("./en.json", with4Spaces)
// 	await env.$fs.writeFile("./fr.json", with4Spaces)
// 	await env.$fs.writeFile("./de.json", withTabs)

// 	const x = plugin({ pathPattern: "./{language}.json" })(env)
// 	const config = await x.config({})
// 	config.sourceLanguageTag = "en"
// 	config.languageTags = ["en", "de", "fr"]

// 	const resources = await config.readResources!({
// 		config: config satisfies Partial<InlangConfig> as any,
// 	})

// 	resources.push({
// 		type: "Resource",
// 		languageTag: {
// 			type: "LanguageTag",
// 			name: "es",
// 		},
// 		body: [
// 			{
// 				type: "Message",
// 				id: {
// 					type: "Identifier",
// 					name: "test",
// 				},
// 				pattern: {
// 					type: "Pattern",
// 					elements: [
// 						{
// 							type: "Text",
// 							value: "test",
// 						},
// 					],
// 				},
// 			},
// 		],
// 	})

// 	await config.writeResources!({
// 		config: config as any,
// 		resources,
// 	})

// 	const file1 = await env.$fs.readFile("./en.json", { encoding: "utf-8" })
// 	const file2 = await env.$fs.readFile("./fr.json", { encoding: "utf-8" })
// 	const file3 = await env.$fs.readFile("./de.json", { encoding: "utf-8" })
// 	const file4 = await env.$fs.readFile("./es.json", { encoding: "utf-8" })

// 	expect(file1).toBe(with4Spaces)
// 	expect(file2).toBe(with4Spaces)
// 	expect(file3).toBe(withTabs)
// 	expect(file4).toBe(with4Spaces)
// })

// it("should remember if a file has a new line at the end or not", async () => {
// 	// @prettier-ignore
// 	const withNewLine = `{
//     "test": "test"
// }
// `

// 	// @prettier-ignore
// 	const withoutNewLine = `{
// 	"test": "test"
// }`

// 	const env = await mockEnvironment({})

// 	await env.$fs.writeFile("./en.json", withNewLine)
// 	await env.$fs.writeFile("./fr.json", withoutNewLine)

// 	const x = plugin({ pathPattern: "./{language}.json" })(env)
// 	const config = await x.config({})
// 	config.sourceLanguageTag = "en"
// 	config.languageTags = ["en", "de", "fr"]

// 	const resources = await config.readResources!({
// 		config: config satisfies Partial<InlangConfig> as any,
// 	})

// 	await config.writeResources!({
// 		config: config satisfies Partial<InlangConfig> as any,
// 		resources,
// 	})

// 	const file1 = await env.$fs.readFile("./en.json", { encoding: "utf-8" })
// 	const file2 = await env.$fs.readFile("./fr.json", { encoding: "utf-8" })

// 	expect(file1).toBe(withNewLine)
// 	expect(file2).toBe(withoutNewLine)
// })

// it("should correctly identify placeholders", async () => {
// 	const enResource = `{
//     "test": "Hello {username}"
// }`

// 	const env = await mockEnvironment({})

// 	await env.$fs.writeFile("./en.json", enResource)

// 	const x = plugin({ pathPattern: "./{language}.json", variableReferencePattern: ["{", "}"] })(env)
// 	const config = await x.config({})
// 	config.sourceLanguageTag = "en"
// 	config.languageTags = ["en"]
// 	const resources = await config.readResources!({
// 		config: config satisfies Partial<InlangConfig> as any,
// 	})
// 	expect(resources[0]?.body[0]?.pattern?.elements[0]?.type).toBe("Text")
// 	expect(resources[0]?.body[0]?.pattern?.elements[1]?.type).toBe("Placeholder")
// })

// it("should parse Placeholders without adding Text elements around it", async () => {
// 	const enResource = `{
//     "test": "{{username}}"
// }`

// 	const env = await mockEnvironment({})

// 	await env.$fs.writeFile("./en.json", enResource)

// 	const x = plugin({ pathPattern: "./{language}.json", variableReferencePattern: ["{{", "}}"] })(
// 		env,
// 	)
// 	const config = await x.config({})
// 	config.sourceLanguageTag = "en"
// 	config.languageTags = ["en"]
// 	const resources = await config.readResources!({
// 		config: config as any,
// 	})
// 	expect(resources[0]?.body[0]?.pattern?.elements[0]?.type).toBe("Placeholder")
// 	expect(resources[0]?.body[0]?.pattern?.elements[1]).toBe(undefined)
// })

// it("should pass roundTrip with unused folder in language dir", async () => {
// 	const enResource = `{
//     "test": "test"
// }`

// 	const env = await mockEnvironment({})

// 	await env.$fs.writeFile("./de.json", enResource)
// 	await env.$fs.writeFile("./en.json", enResource)
// 	await env.$fs.writeFile("dayjs-locale-en.js", enResource)
// 	await env.$fs.mkdir("./__tests__")
// 	await env.$fs.writeFile("./__tests__/localizations.test.ts", enResource)

// 	const x = plugin({ pathPattern: "./{language}.json", ignore: ["__tests__"] })(env)
// 	const config = await x.config({})
// 	config.sourceLanguageTag = "en"
// 	expect(config.languageTags).toStrictEqual(["de", "en"])
// })
