import { expect, it, describe } from "vitest"
import { plugin } from "./plugin.js"
import type { PluginOptions } from "./options.js"
import type { Message, Variant } from "@inlang/plugin"
import { createMockEnvironment, createVariant, getVariant } from "@inlang/plugin"

describe("option pathPattern", () => {
	it("should throw if the path pattern does not include the {languageTag} placeholder", async () => {
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

	it("should throw if the path pattern with namespaces does not include the {languageTag} placeholder", async () => {
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
						common: "./{languageTag}/common",
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
						"namespaceWith.dot": "./{languageTag}/common.json",
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
					pathPattern: "./{languageTag}/*.json",
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
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "Hello world" }))
		const languageTags = ["en"]
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		plugin.setup({ options, fs: env.$fs })
		const messages = await plugin.loadMessages!({ languageTags })
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
		plugin.setup({ options, fs: env.$fs })
		expect(plugin.loadMessages!({ languageTags })).resolves.toBeTruthy()
	})

	it("should work with not yet existing files", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "Hello world" }))
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en", "de"]
		expect(plugin.loadMessages!({ languageTags })).resolves.toBeTruthy()
	})

	it("should add multible variants to the same message", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "Hello world" }))
		await env.$fs.writeFile("./de.json", JSON.stringify({ test: "Hallo welt" }))
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en", "de"]
		const messages = await plugin.loadMessages!({ languageTags })
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
		const messages = await plugin.loadMessages!({ languageTags })
		plugin.setup({ options, fs: env.$fs })
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
		plugin.setup({ options, fs: env.$fs })
		expect(plugin.loadMessages!({ languageTags })).resolves.toBeTruthy()
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
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en", "de"]
		expect(plugin.loadMessages!({ languageTags })).resolves.toBeTruthy()
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
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en", "de"]
		const messages = await plugin.loadMessages!({ languageTags })
		expect(getVariant(messages[0]!, { languageTag: "en" })).toBeTruthy()
		expect(getVariant(messages[0]!, { languageTag: "de" })).toBeTruthy()
	})
})

describe("saveMessage", () => {
	it("test string pathPattern", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({}))
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		plugin.setup({ options, fs: env.$fs })
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
		await plugin.saveMessages!({ messages })
	})

	it("test object pathPattern", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({}))
		const options: PluginOptions = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		plugin.setup({ options, fs: env.$fs })
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
		await plugin.saveMessages!({ messages })
	})
})

describe("expression", () => {
	it("should correctly identify expression (at the end)", async () => {
		const env = await createMockEnvironment({})
		await env.$fs.writeFile("./en.json", JSON.stringify({ test: "Hello {{username}}" }))
		const options: PluginOptions = {
			pathPattern: "./{languageTag}.json",
		}
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({ languageTags })
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
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({ languageTags })
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
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({ languageTags })
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
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en", "de", "fr"]

		const messages = await plugin.loadMessages!({
			languageTags,
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

		await plugin.saveMessages!({ messages: [newMessage!] })

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
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en", "de", "fr"]

		const messages = await plugin.loadMessages!({
			languageTags,
		})

		await plugin.saveMessages!({ messages })

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
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({
			languageTags,
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
		plugin.setup({ options, fs: env.$fs })

		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({
			languageTags,
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
		plugin.setup({ options, fs: env.$fs })
		const languageTags = ["en"]

		const messages = await plugin.loadMessages!({
			languageTags,
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
})

// it("should escape `.` in nested json structures", async () => {
// 	const enResource = `{
// 	"a.": {
// 		"b": "test"
// 	},
// 	"c.": "test"
// }`

// 	const env = await mockEnvironment({})

// 	await env.$fs.mkdir("./en")
// 	await env.$fs.writeFile("./en/common.json", enResource)

// 	const x = plugin({
// 		pathPattern: { common: "./{languageTag}/common.json" },
// 	})(env)
// 	const config = await x.config({})
// 	config.sourceLanguageTag = "en"
// 	config.languageTags = ["en"]
// 	const resources = await config.readResources!({
// 		config: config as InlangConfig,
// 	})

// 	const reference = [
// 		{
// 			type: "Resource",
// 			languageTag: {
// 				type: "LanguageTag",
// 				name: "en",
// 			},
// 			body: [
// 				{
// 					type: "Message",
// 					id: {
// 						type: "Identifier",
// 						name: "common:a..b",
// 					},
// 					pattern: {
// 						type: "Pattern",
// 						elements: [
// 							{
// 								type: "Text",
// 								value: "test",
// 							},
// 						],
// 					},
// 				},
// 				{
// 					type: "Message",
// 					id: {
// 						type: "Identifier",
// 						name: "common:c.",
// 					},
// 					pattern: {
// 						type: "Pattern",
// 						elements: [
// 							{
// 								type: "Text",
// 								value: "test",
// 							},
// 						],
// 					},
// 				},
// 			],
// 		},
// 	]

// 	expect(resources).toStrictEqual(reference)

// 	await config.writeResources!({
// 		resources: resources,
// 		config: config as InlangConfig,
// 	})

// 	const file = await env.$fs.readFile("./en/common.json", { encoding: "utf-8" })
// 	const json = JSON.parse(file as string)
// 	expect(json["a."].b).toStrictEqual("test")
// 	expect(json["c."]).toStrictEqual("test")
// })

// it("should correctly detect the nesting in a file and determine a default based on the majority for newly added resources", async () => {
// 	const withNesting = JSON.stringify(
// 		{
// 			test: {
// 				test: "test",
// 			},
// 		},
// 		undefined,
// 		2,
// 	)

// 	const withoutNesting = JSON.stringify(
// 		{
// 			"test.test": "test",
// 		},
// 		undefined,
// 		4,
// 	)

// 	const env = await mockEnvironment({})

// 	await env.$fs.writeFile("./en.json", withNesting)
// 	await env.$fs.writeFile("./fr.json", withNesting)
// 	await env.$fs.writeFile("./de.json", withoutNesting)

// 	const x = plugin({ pathPattern: "./{languageTag}.json" })(env)
// 	const config = await x.config({})
// 	config.sourceLanguageTag = "en"
// 	config.languageTags = ["en", "de", "fr"]

// 	const resources = await config.readResources!({
// 		config: config as InlangConfig,
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
// 					name: "test.test",
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
// 		config: config as InlangConfig,
// 		resources,
// 	})

// 	const file1 = await env.$fs.readFile("./en.json", { encoding: "utf-8" })
// 	const file2 = await env.$fs.readFile("./fr.json", { encoding: "utf-8" })
// 	const file3 = await env.$fs.readFile("./de.json", { encoding: "utf-8" })
// 	const file4 = await env.$fs.readFile("./es.json", { encoding: "utf-8" })

// 	expect(file1).toBe(withNesting)
// 	expect(file2).toBe(withNesting)
// 	expect(file3).toBe(withoutNesting)
// 	expect(file4).toBe(withNesting)
// })

// it("should throw if element type is not known", async () => {
// 	const resources: ast.Resource[] = [
// 		{
// 			type: "Resource",
// 			languageTag: {
// 				type: "LanguageTag",
// 				name: "en",
// 			},
// 			body: [
// 				{
// 					type: "Message",
// 					id: {
// 						type: "Identifier",
// 						name: "test",
// 					},
// 					pattern: {
// 						type: "Pattern",
// 						elements: [
// 							{
// 								// @ts-ignore
// 								type: "FalseType",
// 								value: "test",
// 							},
// 						],
// 					},
// 				},
// 			],
// 		},
// 	]
// 	const env = await mockEnvironment({})
// 	await env.$fs.writeFile("./en.json", "{}")

// 	const x = plugin({
// 		pathPattern: { common: "./{languageTag}.json" },
// 	})(env)
// 	const config = await x.config({})
// 	config.sourceLanguageTag = "en"
// 	config.languageTags = ["en"]

// 	try {
// 		await config.writeResources!({
// 			resources: resources,
// 			config: config as InlangConfig,
// 		})
// 	} catch (e) {
// 		expect((e as Error).message).toContain("Unknown message pattern element of type")
// 	}
// })

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
			common: "./{languageTag}.json" 
		},
	}
	plugin.setup({ options, fs: env.$fs })
	const messages = await plugin.loadMessages!({ languageTags })
	plugin.saveMessages!({ messages })
	const newMessage = await plugin.loadMessages!({ languageTags })
	expect(newMessage).toStrictEqual(messages)
})

// it("should add default namespace if required by pathPattern", async () => {
// 	const resources: ast.Resource[] = [
// 		{
// 			type: "Resource",
// 			languageTag: {
// 				type: "LanguageTag",
// 				name: "en",
// 			},
// 			body: [
// 				{
// 					type: "Message",
// 					id: {
// 						type: "Identifier",
// 						name: "test",
// 					},
// 					pattern: {
// 						type: "Pattern",
// 						elements: [
// 							{
// 								type: "Text",
// 								value: "test",
// 							},
// 						],
// 					},
// 				},
// 			],
// 		},
// 	]
// 	const env = await mockEnvironment({})
// 	await env.$fs.writeFile("./en.json", "{}")

// 	const x = plugin({
// 		pathPattern: { common: "./{languageTag}.json" },
// 	})(env)
// 	const config = await x.config({})
// 	config.sourceLanguageTag = "en"
// 	config.languageTags = ["en"]

// 	await config.writeResources!({
// 		resources: resources,
// 		config: config as InlangConfig,
// 	})

// 	const newResources = await config.readResources!({
// 		config: config as InlangConfig,
// 	})

// 	expect(newResources[0]?.body[0]?.id.name).toStrictEqual("common:test")
// })

// it("should not throw an error when read Resources with empty namespaces", async () => {
// 	const test = JSON.stringify({
// 		test: "test",
// 	})

// 	const env = await mockEnvironment({})
// 	await env.$fs.mkdir("./en")
// 	await env.$fs.mkdir("./de")
// 	await env.$fs.writeFile("./en/common.json", test)
// 	await env.$fs.writeFile("./en/vital.json", test)
// 	await env.$fs.writeFile("./de/common.json", test)

// 	const x = plugin({
// 		pathPattern: {
// 			common: "./{languageTag}/common.json",
// 			vital: "./{languageTag}/vital.json",
// 		},
// 	})(env)
// 	const config = await x.config({})
// 	config.sourceLanguageTag = "en"

// 	expect(config.languageTags).toStrictEqual(["en", "de"])

// 	let isThrown = false

// 	try {
// 		await config.readResources!({
// 			config: config as InlangConfig,
// 		})
// 	} catch (e) {
// 		isThrown = true
// 	}

// 	expect(isThrown).toBe(false)
// })

// it("should get the correct languages, when single namespace is defined as a pathPattern string 'pathPattern: `public/locales/{languageTag}/translation.json`'", async () => {
// 	const test = JSON.stringify({
// 		test: "test",
// 	})

// 	const env = await mockEnvironment({})
// 	await env.$fs.mkdir("./en")
// 	await env.$fs.mkdir("./de")
// 	await env.$fs.writeFile("./en/common.json", test)
// 	await env.$fs.writeFile("./de/common.json", test)

// 	const x = plugin({
// 		pathPattern: "./{languageTag}/common.json",
// 	})(env)
// 	const config = await x.config({})
// 	config.sourceLanguageTag = "en"

// 	expect(config.languageTags).toStrictEqual(["en", "de"])

// 	let isThrown = false

// 	try {
// 		await config.readResources!({
// 			config: config as InlangConfig,
// 		})
// 	} catch (e) {
// 		isThrown = true
// 	}

// 	expect(isThrown).toBe(false)
// })

// // TODO test empty string
