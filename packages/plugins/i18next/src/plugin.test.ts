import { expect, it, describe } from "vitest"
import type { PluginOptions } from "./options.js"
import type { Message, Plugin, Variant } from "@inlang/plugin"
import { createMockEnvironment, createVariant, getVariant } from "@inlang/plugin"

describe("option pathPattern", () => {
	it("should throw if the path pattern does not include the {languageTag} expression", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", "{}")
		try {
			const plugin = (await import("./plugin.js")) as unknown as Plugin
			plugin.loadMessages!({ 
				languageTags: ["en"], 
				options: { pathPattern: "./resources/" }, 
				nodeishFs: env.$fs 
			})
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})

	it("should throw if the path pattern string does not end with '.json'", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", "{}")
		try {
			const plugin = await import("./plugin.js") as unknown as Plugin
			plugin.loadMessages!({ 
				languageTags: ["en"], 
				options: { pathPattern: "./resources/" }, 
				nodeishFs: env.$fs 
			})
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})

	it("should throw if the path pattern with namespaces does not include the {languageTag} expression", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", "{}")
		try {
			const plugin = await import("./plugin.js") as unknown as Plugin
			plugin.loadMessages!({ 
				languageTags: ["en"],
				options: {
					pathPattern: {
						common: "./common.json",
					},
				},
				nodeishFs: env.$fs,
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
			const plugin = await import("./plugin.js") as unknown as Plugin
			plugin.loadMessages!({ 
				languageTags: ["en"],
				options: {
					pathPattern: {
						common: "./{languageTag}/common",
					},
				},
				nodeishFs: env.$fs,
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
			const plugin = await import("./plugin.js") as unknown as Plugin
			plugin.loadMessages!({ 
				languageTags: ["en"],
				options: {
					pathPattern: {
						"namespaceWith.dot": "./{languageTag}/common.json",
					},
				},
				nodeishFs: env.$fs,
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
			const plugin = await import("./plugin.js") as unknown as Plugin
			plugin.loadMessages!({ 
				languageTags: ["en"],
				options: {
					pathPattern: "./{languageTag}/*.json",
				},
				nodeishFs: env.$fs,
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
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "Hello world" }))
		const languageTags = ["en"]
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const messages = await plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })
		//console.log(getVariant(messages[0]!, { languageTag: "en" }))
		expect(
			(getVariant(messages[0]!, { languageTag: "en" }).data as Variant["pattern"])[0]?.type,
		).toBe("Text")
	})

	it("should work with empty json files", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({}))
		const languageTags = ["en"]
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		expect(plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })).resolves.toBeTruthy()
	})

	it("should work with not yet existing files", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "Hello world" }))
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en", "de"]
		expect(plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })).resolves.toBeTruthy()
	})

	it("should add multible variants to the same message", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "Hello world" }))
		await env.$fs.writeFile("./de.json", JSON.stringify({ test: "Hallo welt" }))
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en", "de"]
		const messages = await plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })
		expect(getVariant(messages[0]!, { languageTag: "en" })).toBeTruthy()
		expect(getVariant(messages[0]!, { languageTag: "de" })).toBeTruthy()
	})

	// namespaces
	it("should return messages if the path pattern is valid (namespace)", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.mkdir("./en")
		await env.$fs.writeFile("./en/common.json", JSON.stringify({ test: "Hello world" }))
		const languageTags = ["en"]
		const options: PluginOptions = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const messages = await plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })
		expect(
			(getVariant(messages[0]!, { languageTag: "en" }).data as Variant["pattern"])[0]?.type,
		).toBe("Text")
	})

	it("should work with empty json files (namespace)", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.mkdir("./en")
		await env.$fs.writeFile("./en/common.json", JSON.stringify({}))
		const languageTags = ["en"]
		const options: PluginOptions = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		expect(plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })).resolves.toBeTruthy()
	})

	it("should work with not yet existing files (namespace)", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.mkdir("./en")
		await env.$fs.writeFile("./en/common.json", JSON.stringify({ test: "Hello world" }))
		const options: PluginOptions = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en", "de"]
		expect(plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })).resolves.toBeTruthy()
	})

	it("should add multible variants to the same message (namespace)", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.mkdir("./en")
		await env.$fs.mkdir("./de")
		await env.$fs.writeFile("./en/common.json", JSON.stringify({ test: "Hello world" }))
		await env.$fs.writeFile("./de/common.json", JSON.stringify({ test: "Hallo welt" }))
		const options: PluginOptions = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en", "de"]
		const messages = await plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })
		expect(getVariant(messages[0]!, { languageTag: "en" })).toBeTruthy()
		expect(getVariant(messages[0]!, { languageTag: "de" })).toBeTruthy()
	})

	it("should not throw an error when load messages with empty namespaces", async () => {
		const test = JSON.stringify({
			test: "test",
		})

		const env = await createMockEnvironment({})
		await env.$fs.mkdir("./en")
		await env.$fs.mkdir("./de")
		await env.$fs.writeFile("./en/common.json", test)
		await env.$fs.writeFile("./en/vital.json", test)
		await env.$fs.writeFile("./de/common.json", test)
		const options: PluginOptions = {
			pathPattern: {
				common: "./{languageTag}/common.json",
				vital: "./{languageTag}/vital.json",
			},
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en", "de"]

		let isThrown = false

		try {
			await plugin.loadMessages!({
				languageTags,
				options,
				nodeishFs: env.$fs,
			})
		} catch (e) {
			isThrown = true
		}

		expect(isThrown).toBe(false)
	})

	it("should get the correct languages, when single namespace is defined as a pathPattern string 'pathPattern: `public/locales/{languageTag}/translation.json`'", async () => {
		const test = JSON.stringify({
			test: "test",
		})

		const env = await createMockEnvironment({})
		await env.$fs.mkdir("./en")
		await env.$fs.mkdir("./de")
		await env.$fs.writeFile("./en/common.json", test)
		await env.$fs.writeFile("./de/common.json", test)

		const options: PluginOptions = {
			pathPattern: {
				pathPattern: "./{languageTag}/common.json",
			},
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en", "de"]

		let isThrown = false

		try {
			await plugin.loadMessages!({
				languageTags,
				options,
				nodeishFs: env.$fs,
			})
		} catch (e) {
			isThrown = true
		}

		expect(isThrown).toBe(false)
	})

	it("should not throw an error when the path to the resources is not present", async () => {
		const env = await createMockEnvironment({})

		const options: PluginOptions = {
			pathPattern: {
				pathPattern: ".lang/{languageTag}.json",
			},
		}
		const languageTags = ["en"]

		let isThrown = false

		try {
			const plugin = await import("./plugin.js") as unknown as Plugin
			await plugin.loadMessages!({
				languageTags,
				options,
				nodeishFs: env.$fs,
			})
		} catch (e) {
			isThrown = true
		}

		expect(isThrown).toBe(false)
	})
})

describe("saveMessage", () => {
	it("test string pathPattern", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({}))
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const messages: Message[] = [
			{
				id: "test",
				expressions: [],
				selectors: [],
				body: {
					en: [
						{
							match: {},
							pattern: [
								{
									type: "Text",
									value: "Hello world",
								},
							],
						},
					],
				},
			},
		]
		await plugin.saveMessages!({ messages, options, nodeishFs: env.$fs })
	})

	it("test object pathPattern", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({}))
		const options: PluginOptions = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const messages: Message[] = [
			{
				id: "common:test",
				expressions: [],
				selectors: [],
				body: {
					en: [
						{
							match: {},
							pattern: [
								{
									type: "Text",
									value: "Hello world",
								},
							],
						},
					],
				},
			},
			{
				id: "common:test2",
				expressions: [],
				selectors: [],
				body: {
					en: [
						{
							match: {},
							pattern: [
								{
									type: "Text",
									value: "Hello world2",
								},
							],
						},
					],
				},
			},
		]
		await plugin.saveMessages!({ messages, options, nodeishFs: env.$fs })
	})
})

describe("expression", () => {
	it("should correctly identify expression (at the end)", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "Hello {{username}}" }))
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })
		expect(getVariant(messages[0]!, { languageTag: "en" }).data!.length).toBe(2)
		expect(getVariant(messages[0]!, { languageTag: "en" }).data![0]!.type).toBe("Text")
		expect(getVariant(messages[0]!, { languageTag: "en" }).data![1]!.type).toBe("Expression")
	})

	it("should correctly identify expression (at the beginning)", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "{{username}} the great" }))
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })
		expect(getVariant(messages[0]!, { languageTag: "en" }).data!.length).toBe(2)
		expect(getVariant(messages[0]!, { languageTag: "en" }).data![0]!.type).toBe("Expression")
		expect(getVariant(messages[0]!, { languageTag: "en" }).data![1]!.type).toBe("Text")
	})

	it("should correctly apply the variableReferencePattern", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "Hello @username" }))
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
			variableReferencePattern: ["@"],
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })
		expect(getVariant(messages[0]!, { languageTag: "en" }).data![0]!.type).toBe("Text")
		expect(getVariant(messages[0]!, { languageTag: "en" }).data![1]!.type).toBe("Expression")
	})
})

describe("formatting", () => {
	it("should preserve the spacing resources and determine a default based on the majority for newly added resources", async () => {
		// @prettier-ignore
		const with4Spaces = `{
    "test": "test"
}`

		// @prettier-ignore
		const withTabs = `{
	"test": "test"
}`

		const env = await createMockEnvironment({})

		await env.$fs.writeFile("./en.json", with4Spaces)
		await env.$fs.writeFile("./fr.json", with4Spaces)
		await env.$fs.writeFile("./de.json", withTabs)
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en", "de", "fr"]

		const messages = await plugin.loadMessages!({
			languageTags,
			options,
			nodeishFs: env.$fs,
		})

		const variant: Variant = {
			match: {},
			pattern: [
				{
					type: "Text",
					value: "test",
				},
			],
		}

		const newMessage = createVariant(messages[0]!, { languageTag: "es", data: variant }).data

		await plugin.saveMessages!({ messages: [newMessage!], options, nodeishFs: env.$fs })

		const file1 = await env.$fs.readFile("./en.json", { encoding: "utf-8" })
		const file2 = await env.$fs.readFile("./fr.json", { encoding: "utf-8" })
		const file3 = await env.$fs.readFile("./de.json", { encoding: "utf-8" })
		const file4 = await env.$fs.readFile("./es.json", { encoding: "utf-8" })

		expect(file1).toBe(with4Spaces)
		expect(file2).toBe(with4Spaces)
		expect(file3).toBe(withTabs)
		expect(file4).toBe(with4Spaces)
	})

	it("should remember if a file has a new line at the end or not", async () => {
		// @prettier-ignore
		const withNewLine = `{
	"test": "test"
}
`

		// @prettier-ignore
		const withoutNewLine = `{
	"test": "test"
}`

		const env = await createMockEnvironment({})

		await env.$fs.writeFile("./en.json", withNewLine)
		await env.$fs.writeFile("./fr.json", withoutNewLine)

		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en", "de", "fr"]

		const messages = await plugin.loadMessages!({
			languageTags,
			options,
			nodeishFs: env.$fs,
		})

		await plugin.saveMessages!({ messages, options, nodeishFs: env.$fs })

		const file1 = await env.$fs.readFile("./en.json", { encoding: "utf-8" })
		const file2 = await env.$fs.readFile("./fr.json", { encoding: "utf-8" })

		expect(file1).toBe(withNewLine)
		expect(file2).toBe(withoutNewLine)
	})

	it("should escape `.` in flattened json structures", async () => {
		const enResource = `{
    "test.": "test",
	"test.test": "test"
}`

		const env = await createMockEnvironment({})

		await env.$fs.mkdir("./en")
		await env.$fs.writeFile("./en/common.json", enResource)

		const options: PluginOptions = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({
			languageTags,
			options,
			nodeishFs: env.$fs,
		})

		const reference: Message[] = [
			{
				id: "common:test.",
				expressions: [],
				selectors: [],
				body: {
					en: [
						{
							match: {},
							pattern: [
								{
									type: "Text",
									value: "test",
								},
							],
						},
					],
				},
			},
			{
				id: "common:test.test",
				expressions: [],
				selectors: [],
				body: {
					en: [
						{
							match: {},
							pattern: [
								{
									type: "Text",
									value: "test",
								},
							],
						},
					],
				},
			},
		]

		expect(messages).toStrictEqual(reference)
	})

	it("should escape `.` in nested json structures", async () => {
		const enResource = `{
	"a.": {
		"b": "test"
	},
	"c.": "test"
}`

		const env = await createMockEnvironment({})

		await env.$fs.mkdir("./en")
		await env.$fs.writeFile("./en/common.json", enResource)

		const options: PluginOptions = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({
			languageTags,
			options,
			nodeishFs: env.$fs,
		})

		const reference: Message[] = [
			{
				id: "common:a..b",
				expressions: [],
				selectors: [],
				body: {
					en: [
						{
							match: {},
							pattern: [
								{
									type: "Text",
									value: "test",
								},
							],
						},
					],
				},
			},
			{
				id: "common:c.",
				expressions: [],
				selectors: [],
				body: {
					en: [
						{
							match: {},
							pattern: [
								{
									type: "Text",
									value: "test",
								},
							],
						},
					],
				},
			},
		]

		expect(messages).toStrictEqual(reference)
		await plugin.saveMessages!({
			messages,
			options,
			nodeishFs: env.$fs,
		})

		const file = await env.$fs.readFile("./en/common.json", { encoding: "utf-8" })
		const json = JSON.parse(file as string)
		expect(json["a."].b).toStrictEqual("test")
		expect(json["c."]).toStrictEqual("test")
	})

	it("should correctly detect the nesting in a file and determine a default based on the majority for newly added resources", async () => {
		const withNesting = JSON.stringify(
			{
				test: {
					test: "test",
				},
			},
			undefined,
			2,
		)

		const withoutNesting = JSON.stringify(
			{
				"test.test": "test",
			},
			undefined,
			4,
		)

		const env = await createMockEnvironment({})

		await env.$fs.writeFile("./en.json", withNesting)
		await env.$fs.writeFile("./fr.json", withNesting)
		await env.$fs.writeFile("./de.json", withoutNesting)

		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en", "de", "fr"]

		const messages = await plugin.loadMessages!({
			languageTags,
			options,
			nodeishFs: env.$fs,
		})

		messages.push({
			id: "test.test",
			expressions: [],
			selectors: [],
			body: {
				es: [
					{
						match: {},
						pattern: [
							{
								type: "Text",
								value: "test",
							},
						],
					},
				],
			},
		})

		await plugin.saveMessages!({
			messages,
			options,
			nodeishFs: env.$fs,
		})

		const file1 = await env.$fs.readFile("./en.json", { encoding: "utf-8" })
		const file2 = await env.$fs.readFile("./fr.json", { encoding: "utf-8" })
		const file3 = await env.$fs.readFile("./de.json", { encoding: "utf-8" })
		const file4 = await env.$fs.readFile("./es.json", { encoding: "utf-8" })

		expect(file1).toBe(withNesting)
		expect(file2).toBe(withNesting)
		expect(file3).toBe(withoutNesting)
		expect(file4).toBe(withNesting)
	})
})

describe("roundTrip", () => {
	it("should serialize newly added messages", async () => {
		const enResource = `{
	"test": "{{username}}"
}`

		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", enResource)
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({
			languageTags,
			options,
			nodeishFs: env.$fs,
		})

		const variant: Variant = {
			match: {},
			pattern: [
				{
					type: "Text",
					value: "This is new",
				},
			],
		}

		const newMessage = {
			id: "test2",
			expressions: [],
			selectors: [],
			body: {
				en: [variant],
			},
		}

		messages.push(newMessage)
		await plugin.saveMessages!({
			messages,
			options,
			nodeishFs: env.$fs,
		})
		const newFile = (await env.$fs.readFile("./en.json", { encoding: "utf-8" })) as string
		const json = JSON.parse(newFile)
		expect(json.test).toBe("{{username}}")
		expect(json.test2).toBe("This is new")
	})

	it("should correctly parse resources with pathPattern that contain namespaces", async () => {
		const testResource = `{
	"test": "test"
}`

		const env = await createMockEnvironment({})

		await env.$fs.mkdir("./en")
		await env.$fs.writeFile("./en/common.json", testResource)

		const options: PluginOptions = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const languageTags = ["en"]

		const messages = await plugin.loadMessages!({
			languageTags,
			options,
			nodeishFs: env.$fs,
		})

		const reference: Message[] = [
			{
				id: "common:test",
				expressions: [],
				selectors: [],
				body: {
					en: [
						{
							match: {},
							pattern: [
								{
									type: "Text",
									value: "test",
								},
							],
						},
					],
				},
			},
		]

		expect(messages).toStrictEqual(reference)
	})

	it("should successfully do a roundtrip with complex content", async () => {
		const complexContent = JSON.stringify(
			{
				"//multiLineString": {
					multiline: "This is a\nmulti-line\nstring.",
				},
				unicodeCharacters: {
					emoji: "\uD83D\uDE00",
					currency: "€",
				},
				test: 'Single "quote" test',
			},
			undefined,
			4,
		)
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", complexContent)
		const languageTags = ["en"]
		const options: PluginOptions = {
			pathPattern: {
				common: "./{languageTag}.json",
			},
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const messages = await plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })
		plugin.saveMessages!({ messages, options, nodeishFs: env.$fs })
		const newMessage = await plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })
		expect(newMessage).toStrictEqual(messages)
	})

	it("should successfully do a roundtrip with empty message value", async () => {
		const test = JSON.stringify({
			test: "",
		})
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", test)
		const languageTags = ["en"]
		const options: PluginOptions = {
			pathPattern: {
				common: "./{languageTag}.json",
			},
		}
		const plugin = await import("./plugin.js") as unknown as Plugin
		const messages = await plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })
		plugin.saveMessages!({ messages, options, nodeishFs: env.$fs })
		const newMessage = await plugin.loadMessages!({ languageTags, options, nodeishFs: env.$fs })
		expect(newMessage).toStrictEqual(messages)
	})
})
