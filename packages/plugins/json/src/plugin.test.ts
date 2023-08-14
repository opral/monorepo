import { expect, it, describe } from "vitest"
import type { PluginSettings } from "./settings.js"
import type { Message, Variant } from "@inlang/plugin"
import { createVariant, getVariant } from "@inlang/plugin"
import { createMockNodeishFs } from "@inlang/plugin/test"
import { plugin } from "./plugin.js"

describe("option pathPattern", () => {
	it("should throw if the path pattern does not include the {languageTag} variable reference", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", "{}")
		try {
			await plugin.loadMessages!({
				languageTags: ["en"],
				settings: { pathPattern: "./resources/" },
				nodeishFs: fs,
			})
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})

	it("should throw if the path pattern string does not end with '.json'", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", "{}")
		try {
			await plugin.loadMessages!({
				languageTags: ["en"],
				settings: { pathPattern: "./resources/" },
				nodeishFs: fs,
			})
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})

	it("should throw if the path pattern with namespaces does not include the {languageTag} variable reference", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", "{}")
		try {
			await plugin.loadMessages!({
				languageTags: ["en"],
				settings: {
					pathPattern: {
						common: "./common.json",
					},
				},
				nodeishFs: fs,
			})
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})

	it("should throw if the path pattern with namespaces does not end with '.json'", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", "{}")
		try {
			await plugin.loadMessages!({
				languageTags: ["en"],
				settings: {
					pathPattern: {
						common: "./{languageTag}/common",
					},
				},
				nodeishFs: fs,
			})
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})

	it("should throw if the path pattern with namespaces has a namespace with a dot", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", "{}")
		try {
			await plugin.loadMessages!({
				languageTags: ["en"],
				settings: {
					pathPattern: {
						"namespaceWith.dot": "./{languageTag}/common.json",
					},
				},
				nodeishFs: fs,
			})
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})

	it("should throw if the path pattern includes wildcard", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", "{}")
		try {
			await plugin.loadMessages!({
				languageTags: ["en"],
				settings: {
					pathPattern: "./{languageTag}/*.json",
				},
				nodeishFs: fs,
			})
			throw new Error("should not reach this")
		} catch (e) {
			expect((e as Error).message).toContain("pathPattern")
		}
	})
})

describe("loadMessage", () => {
	it("should return messages if the path pattern is valid", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", JSON.stringify({ test: "Hello world" }))
		const languageTags = ["en"]
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
		}

		const messages = await plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })
		//console.log(getVariant(messages[0]!, { languageTag: "en" }))
		expect(
			(getVariant(messages[0]!, { languageTag: "en" }).data as Variant["pattern"])[0]?.type,
		).toBe("Text")
	})

	it("should work with empty json files", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", JSON.stringify({}))
		const languageTags = ["en"]
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
		}

		expect(plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })).resolves.toBeTruthy()
	})

	it("should work with not yet existing files", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", JSON.stringify({ test: "Hello world" }))
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
		}

		const languageTags = ["en", "de"]
		expect(plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })).resolves.toBeTruthy()
	})

	it("should add multible variants to the same message", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", JSON.stringify({ test: "Hello world" }))
		await fs.writeFile("./de.json", JSON.stringify({ test: "Hallo welt" }))
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
		}

		const languageTags = ["en", "de"]
		const messages = await plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })
		expect(getVariant(messages[0]!, { languageTag: "en" })).toBeTruthy()
		expect(getVariant(messages[0]!, { languageTag: "de" })).toBeTruthy()
	})

	// namespaces
	it("should return messages if the path pattern is valid (namespace)", async () => {
		const fs = await createMockNodeishFs()
		await fs.mkdir("./en")
		await fs.writeFile("./en/common.json", JSON.stringify({ test: "Hello world" }))
		const languageTags = ["en"]
		const settings: PluginSettings = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}

		const messages = await plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })
		expect(
			(getVariant(messages[0]!, { languageTag: "en" }).data as Variant["pattern"])[0]?.type,
		).toBe("Text")
	})

	it("should work with empty json files (namespace)", async () => {
		const fs = await createMockNodeishFs()
		await fs.mkdir("./en")
		await fs.writeFile("./en/common.json", JSON.stringify({}))
		const languageTags = ["en"]
		const settings: PluginSettings = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}

		expect(plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })).resolves.toBeTruthy()
	})

	it("should work with not yet existing files (namespace)", async () => {
		const fs = await createMockNodeishFs()
		await fs.mkdir("./en")
		await fs.writeFile("./en/common.json", JSON.stringify({ test: "Hello world" }))
		const settings: PluginSettings = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}

		const languageTags = ["en", "de"]
		expect(plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })).resolves.toBeTruthy()
	})

	it("should add multible variants to the same message (namespace)", async () => {
		const fs = await createMockNodeishFs()
		await fs.mkdir("./en")
		await fs.mkdir("./de")
		await fs.writeFile("./en/common.json", JSON.stringify({ test: "Hello world" }))
		await fs.writeFile("./de/common.json", JSON.stringify({ test: "Hallo welt" }))
		const settings: PluginSettings = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const languageTags = ["en", "de"]
		const messages = await plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })
		expect(getVariant(messages[0]!, { languageTag: "en" })).toBeTruthy()
		expect(getVariant(messages[0]!, { languageTag: "de" })).toBeTruthy()
	})

	it("should not throw an error when load messages with empty namespaces", async () => {
		const test = JSON.stringify({
			test: "test",
		})
		const fs = await createMockNodeishFs()
		await fs.mkdir("./en")
		await fs.mkdir("./de")
		await fs.writeFile("./en/common.json", test)
		await fs.writeFile("./en/vital.json", test)
		await fs.writeFile("./de/common.json", test)
		const settings: PluginSettings = {
			pathPattern: {
				common: "./{languageTag}/common.json",
				vital: "./{languageTag}/vital.json",
			},
		}
		const languageTags = ["en", "de"]
		let isThrown = false
		try {
			await plugin.loadMessages!({
				languageTags,
				settings,
				nodeishFs: fs,
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
		const fs = await createMockNodeishFs()
		await fs.mkdir("./en")
		await fs.mkdir("./de")
		await fs.writeFile("./en/common.json", test)
		await fs.writeFile("./de/common.json", test)
		const settings: PluginSettings = {
			pathPattern: {
				pathPattern: "./{languageTag}/common.json",
			},
		}
		const languageTags = ["en", "de"]
		let isThrown = false
		try {
			await plugin.loadMessages!({
				languageTags,
				settings,
				nodeishFs: fs,
			})
		} catch (e) {
			isThrown = true
		}
		expect(isThrown).toBe(false)
	})

	it("should not throw an error when the path to the resources is not present", async () => {
		const fs = await createMockNodeishFs()
		const settings: PluginSettings = {
			pathPattern: {
				pathPattern: ".lang/{languageTag}.json",
			},
		}
		const languageTags = ["en"]
		let isThrown = false
		try {
			await plugin.loadMessages!({
				languageTags,
				settings,
				nodeishFs: fs,
			})
		} catch (e) {
			isThrown = true
		}
		expect(isThrown).toBe(false)
	})
})

describe("saveMessage", () => {
	it("test string pathPattern", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", JSON.stringify({}))
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
		}
		const messages: Message[] = [
			{
				id: "test",
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
		await plugin.saveMessages!({ messages, settings, nodeishFs: fs })
	})

	it("test object pathPattern", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", JSON.stringify({}))
		const settings: PluginSettings = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const messages: Message[] = [
			{
				id: "common:test",
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
		await plugin.saveMessages!({ messages, settings, nodeishFs: fs })
	})
})

describe("variable reference", () => {
	it("should correctly identify variable reference (at the end)", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", JSON.stringify({ test: "Hello {{username}}" }))
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
		}
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })
		expect(getVariant(messages[0]!, { languageTag: "en" }).data!.length).toBe(2)
		expect(getVariant(messages[0]!, { languageTag: "en" }).data![0]!.type).toBe("Text")
		expect(getVariant(messages[0]!, { languageTag: "en" }).data![1]!.type).toBe("VariableReference")
	})

	it("should correctly identify variable reference (at the beginning)", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", JSON.stringify({ test: "{{username}} the great" }))
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
		}
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })
		expect(getVariant(messages[0]!, { languageTag: "en" }).data!.length).toBe(2)
		expect(getVariant(messages[0]!, { languageTag: "en" }).data![0]!.type).toBe("VariableReference")
		expect(getVariant(messages[0]!, { languageTag: "en" }).data![1]!.type).toBe("Text")
	})

	it("should correctly apply the variableReferencePattern", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", JSON.stringify({ test: "Hello @username" }))
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
			variableReferencePattern: ["@"],
		}
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })
		expect(getVariant(messages[0]!, { languageTag: "en" }).data![0]!.type).toBe("Text")
		expect(getVariant(messages[0]!, { languageTag: "en" }).data![1]!.type).toBe("VariableReference")
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

		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", with4Spaces)
		await fs.writeFile("./fr.json", with4Spaces)
		await fs.writeFile("./de.json", withTabs)
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
		}
		const languageTags = ["en", "de", "fr"]
		const messages = await plugin.loadMessages!({
			languageTags,
			settings,
			nodeishFs: fs,
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
		await plugin.saveMessages!({ messages: [newMessage!], settings, nodeishFs: fs })

		const file1 = await fs.readFile("./en.json", { encoding: "utf-8" })
		const file2 = await fs.readFile("./fr.json", { encoding: "utf-8" })
		const file3 = await fs.readFile("./de.json", { encoding: "utf-8" })
		const file4 = await fs.readFile("./es.json", { encoding: "utf-8" })

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

		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", withNewLine)
		await fs.writeFile("./fr.json", withoutNewLine)
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
		}
		const languageTags = ["en", "de", "fr"]
		const messages = await plugin.loadMessages!({
			languageTags,
			settings,
			nodeishFs: fs,
		})
		await plugin.saveMessages!({ messages, settings, nodeishFs: fs })
		const file1 = await fs.readFile("./en.json", { encoding: "utf-8" })
		const file2 = await fs.readFile("./fr.json", { encoding: "utf-8" })
		expect(file1).toBe(withNewLine)
		expect(file2).toBe(withoutNewLine)
	})

	it("should escape `.` in flattened json structures", async () => {
		const enResource = `{
    "test.": "test",
	"test.test": "test"
}`

		const fs = await createMockNodeishFs()
		await fs.mkdir("./en")
		await fs.writeFile("./en/common.json", enResource)
		const settings: PluginSettings = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({
			languageTags,
			settings,
			nodeishFs: fs,
		})
		const reference: Message[] = [
			{
				id: "common:test.",
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

		const fs = await createMockNodeishFs()
		await fs.mkdir("./en")
		await fs.writeFile("./en/common.json", enResource)
		const settings: PluginSettings = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({
			languageTags,
			settings,
			nodeishFs: fs,
		})
		const reference: Message[] = [
			{
				id: "common:a..b",
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
			settings,
			nodeishFs: fs,
		})
		const file = await fs.readFile("./en/common.json", { encoding: "utf-8" })
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

		const fs = await createMockNodeishFs()

		await fs.writeFile("./en.json", withNesting)
		await fs.writeFile("./fr.json", withNesting)
		await fs.writeFile("./de.json", withoutNesting)

		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
		}

		const languageTags = ["en", "de", "fr"]

		const messages = await plugin.loadMessages!({
			languageTags,
			settings,
			nodeishFs: fs,
		})

		messages.push({
			id: "test.test",
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
			settings,
			nodeishFs: fs,
		})

		const file1 = await fs.readFile("./en.json", { encoding: "utf-8" })
		const file2 = await fs.readFile("./fr.json", { encoding: "utf-8" })
		const file3 = await fs.readFile("./de.json", { encoding: "utf-8" })
		const file4 = await fs.readFile("./es.json", { encoding: "utf-8" })

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

		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", enResource)
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
		}

		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({
			languageTags,
			settings,
			nodeishFs: fs,
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
			selectors: [],
			body: {
				en: [variant],
			},
		}
		messages.push(newMessage)
		await plugin.saveMessages!({
			messages,
			settings,
			nodeishFs: fs,
		})
		const newFile = (await fs.readFile("./en.json", { encoding: "utf-8" })) as string
		const json = JSON.parse(newFile)
		expect(json.test).toBe("{{username}}")
		expect(json.test2).toBe("This is new")
	})

	it("should correctly parse resources with pathPattern that contain namespaces", async () => {
		const testResource = `{
	"test": "test"
}`

		const fs = await createMockNodeishFs()
		await fs.mkdir("./en")
		await fs.writeFile("./en/common.json", testResource)
		const settings: PluginSettings = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const languageTags = ["en"]
		const messages = await plugin.loadMessages!({
			languageTags,
			settings,
			nodeishFs: fs,
		})
		const reference: Message[] = [
			{
				id: "common:test",
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
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", complexContent)
		const languageTags = ["en"]
		const settings: PluginSettings = {
			pathPattern: {
				common: "./{languageTag}.json",
			},
		}
		const messages = await plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })
		plugin.saveMessages!({ messages, settings, nodeishFs: fs })
		const newMessage = await plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })
		expect(newMessage).toStrictEqual(messages)
	})

	it("should successfully do a roundtrip with empty message value", async () => {
		const test = JSON.stringify({
			test: "",
		})
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", test)
		const languageTags = ["en"]
		const settings: PluginSettings = {
			pathPattern: {
				common: "./{languageTag}.json",
			},
		}
		const messages = await plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })
		plugin.saveMessages!({ messages, settings, nodeishFs: fs })
		const newMessage = await plugin.loadMessages!({ languageTags, settings, nodeishFs: fs })
		expect(newMessage).toStrictEqual(messages)
	})
})

describe("detectedLanguageTags", () => {
	it("get correct LanguageTags with string pathPattern", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", "{}")
		await fs.writeFile("./de.json", "{}")
		await fs.writeFile("./fr.json", "{}")
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
		}
		const detectedLanguages = await plugin.detectedLanguageTags!({ settings, nodeishFs: fs })
		expect(detectedLanguages).toStrictEqual(["en", "de", "fr"])
	})

	it("get correct LanguageTags with object pathPattern", async () => {
		const fs = await createMockNodeishFs()
		await fs.mkdir("./en")
		await fs.writeFile("./en/common.json", "{}")
		await fs.mkdir("./de")
		await fs.writeFile("./de/common.json", "{}")
		const settings: PluginSettings = {
			pathPattern: {
				common: "./{languageTag}/common.json",
			},
		}
		const detectedLanguages = await plugin.detectedLanguageTags!({ settings, nodeishFs: fs })
		expect(detectedLanguages).toStrictEqual(["en", "de"])
	})

	it("get correct LanguageTags with ignore", async () => {
		const fs = await createMockNodeishFs()
		await fs.writeFile("./en.json", "{}")
		await fs.writeFile("./de.json", "{}")
		await fs.writeFile("./package.json", "{}")
		const settings: PluginSettings = {
			pathPattern: "./{languageTag}.json",
			ignore: ["package.json"],
		}
		const detectedLanguages = await plugin.detectedLanguageTags!({ settings, nodeishFs: fs })
		expect(detectedLanguages).toStrictEqual(["en", "de"])
	})
})
