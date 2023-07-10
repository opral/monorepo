import { mockEnvironment } from "@inlang/core/test"
import { query } from "@inlang/core/query"
import { expect, it } from "vitest"
import { plugin } from "./plugin.js"
import type { InlangConfig } from "@inlang/core/config"
import type * as ast from "@inlang/core/ast"

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

it("should throw if the path pattern string does not end with '.json'", async () => {
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", "{}")
	const x = plugin({ pathPattern: "./{language}" })(env)
	try {
		await x.config({})
		throw new Error("should not reach this")
	} catch (e) {
		expect((e as Error).message).toContain("pathPattern")
	}
})

it("should throw if the path pattern with namespaces does not include the {language} placeholder", async () => {
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", "{}")
	const x = plugin({
		pathPattern: {
			common: "./common.json",
		},
	})(env)
	try {
		await x.config({})
		throw new Error("should not reach this")
	} catch (e) {
		expect((e as Error).message).toContain("pathPattern")
	}
})

it("should throw if the path pattern with namespaces does not end with '.json'", async () => {
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", "{}")
	const x = plugin({
		pathPattern: {
			common: "./{language}/common",
		},
	})(env)
	try {
		await x.config({})
		throw new Error("should not reach this")
	} catch (e) {
		expect((e as Error).message).toContain("pathPattern")
	}
})

it("should throw if the path pattern with namespaces has a namespace with a dot", async () => {
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", "{}")
	const x = plugin({
		pathPattern: {
			"namespaceWith.dot": "./{language}/common.json",
		},
	})(env)
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
			} as InlangConfig,
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
			} as InlangConfig,
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
		config: config as InlangConfig,
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
		config: config as InlangConfig,
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

	const env = await mockEnvironment({})

	await env.$fs.writeFile("./en.json", withNewLine)
	await env.$fs.writeFile("./fr.json", withoutNewLine)

	const x = plugin({ pathPattern: "./{language}.json" })(env)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en", "de", "fr"]

	const resources = await config.readResources!({
		config: config as InlangConfig,
	})

	await config.writeResources!({
		config: config as InlangConfig,
		resources,
	})

	const file1 = await env.$fs.readFile("./en.json", { encoding: "utf-8" })
	const file2 = await env.$fs.readFile("./fr.json", { encoding: "utf-8" })

	expect(file1).toBe(withNewLine)
	expect(file2).toBe(withoutNewLine)
})

it("should correctly identify placeholders", async () => {
	const enResource = `{
    "test": "Hello {{username}}"
}`

	const env = await mockEnvironment({})

	await env.$fs.writeFile("./en.json", enResource)

	const x = plugin({ pathPattern: "./{language}.json", variableReferencePattern: ["{{", "}}"] })(
		env,
	)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en"]
	const resources = await config.readResources!({
		config: config as InlangConfig,
	})
	expect(resources[0]?.body[0]?.pattern?.elements[0]?.type).toBe("Text")
	expect(resources[0]?.body[0]?.pattern?.elements[1]?.type).toBe("Placeholder")
})

it("should correctly identify placeholders with only no trailing pattern", async () => {
	const enResource = `{
    "test": "Hello @:username"
}`

	const env = await mockEnvironment({})

	await env.$fs.writeFile("./en.json", enResource)

	const x = plugin({ pathPattern: "./{language}.json", variableReferencePattern: ["@:"] })(env)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en"]
	const resources = await config.readResources!({
		config: config as InlangConfig,
	})
	await config.writeResources!({
		resources: resources,
		config: config as InlangConfig,
	})
	const newResources = await config.readResources!({
		config: config as InlangConfig,
	})
	expect(newResources[0]?.body[0]?.pattern?.elements[0]?.type).toBe("Text")
	expect(newResources[0]?.body[0]?.pattern?.elements[1]?.type).toBe("Placeholder")
})

it("should parse Placeholders without adding Text elements around it", async () => {
	const enResource = `{
    "test": "{{username}}"
}`

	const env = await mockEnvironment({})

	await env.$fs.writeFile("./en.json", enResource)

	const x = plugin({ pathPattern: "./{language}.json", variableReferencePattern: ["{{", "}}"] })(
		env,
	)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en"]
	const resources = await config.readResources!({
		config: config as InlangConfig,
	})
	await config.writeResources!({
		resources: resources,
		config: config as InlangConfig,
	})
	const newResources = await config.readResources!({
		config: config as InlangConfig,
	})
	expect(newResources[0]?.body[0]?.pattern?.elements[0]?.type).toBe("Placeholder")
	expect(newResources[0]?.body[0]?.pattern?.elements[1]).toBe(undefined)
})

it("should serialize newly added messages", async () => {
	const enResource = `{
    "test": "{{username}}"
}`

	const env = await mockEnvironment({})

	await env.$fs.writeFile("./en.json", enResource)

	const x = plugin({ pathPattern: "./{language}.json", variableReferencePattern: ["{{", "}}"] })(
		env,
	)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en"]
	const resources = await config.readResources!({
		config: config as InlangConfig,
	})
	const [newResource] = query(resources[0]!).create({
		message: {
			type: "Message",
			id: { type: "Identifier", name: "test2" },
			pattern: { type: "Pattern", elements: [{ type: "Text", value: "Hello world" }] },
		},
	})
	await config.writeResources!({
		config: config as InlangConfig,
		resources: [newResource!],
	})
	const newFile = (await env.$fs.readFile("./en.json", { encoding: "utf-8" })) as string
	const json = JSON.parse(newFile)
	expect(json.test).toBe("{{username}}")
	expect(json.test2).toBe("Hello world")
})

it("should return languages of a pathPattern string", async () => {
	const enResource = `{
    "test": "hello"
}`

	const env = await mockEnvironment({})

	await env.$fs.writeFile("./en.json", enResource)

	const x = plugin({ pathPattern: "./{language}.json" })(env)
	const config = await x.config({})
	config.referenceLanguage = "en"

	const languages = config.languages
	expect(languages).toStrictEqual(["en"])
})

it("should return languages of a pathPattern object", async () => {
	const testResource = `{
    "test": "hello"
}`

	const env = await mockEnvironment({})
	await env.$fs.mkdir("./en")
	await env.$fs.mkdir("./de")
	await env.$fs.writeFile("./en/common.json", testResource)
	await env.$fs.writeFile("./en/vital.json", testResource)
	await env.$fs.writeFile("./de/common.json", testResource)
	await env.$fs.writeFile("./de/vital.json", testResource)

	const x = plugin({
		pathPattern: {
			common: "./{language}/common.json",
			vital: "./{language}/vital.json",
		},
	})(env)
	const config = await x.config({})
	config.referenceLanguage = "en"

	const languages = config.languages
	expect(languages).toStrictEqual(["en", "de"])
})

it("should return languages of a pathPattern object in monorepo", async () => {
	const testResource = `{
    "test": "hello"
}`

	const env = await mockEnvironment({})
	await env.$fs.mkdir("./projectA")
	await env.$fs.mkdir("./projectA/en")
	await env.$fs.mkdir("./projectA/de")
	await env.$fs.mkdir("./projectB")
	await env.$fs.mkdir("./projectB/en")
	await env.$fs.mkdir("./projectB/de")
	await env.$fs.mkdir("./projectB/fr")
	await env.$fs.writeFile("./projectA/en/common.json", testResource)
	await env.$fs.writeFile("./projectA/de/common.json", testResource)
	await env.$fs.writeFile("./projectB/en/common.json", testResource)
	await env.$fs.writeFile("./projectB/de/common.json", testResource)
	await env.$fs.writeFile("./projectB/fr/common.json", testResource)

	const x = plugin({
		pathPattern: {
			"projectA-common": "./projectA/{language}/common.json",
			"projectB-common": "./projectB/{language}/common.json",
		},
	})(env)
	const config = await x.config({})
	config.referenceLanguage = "en"

	const languages = config.languages
	expect(languages).toStrictEqual(["en", "de", "fr"])
})

it("should correctly parse resources with pathPattern that contain namespaces", async () => {
	const testResource = `{
    "test": "test"
}`

	const env = await mockEnvironment({})

	await env.$fs.mkdir("./en")
	await env.$fs.writeFile("./en/common.json", testResource)

	const x = plugin({
		pathPattern: {
			common: "./{language}/common.json",
		},
	})(env)
	const config = await x.config({})
	config.referenceLanguage = "en"

	const resources = await config.readResources!({
		config: config as InlangConfig,
	})

	const reference = [
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "en",
			},
			body: [
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "common:test",
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
		},
	]

	expect(resources).toStrictEqual(reference)
})

it("should add a new language for pathPattern string", async () => {
	const enResource = `{
    "test": "test"
}`

	const env = await mockEnvironment({})

	await env.$fs.writeFile("./en.json", enResource)

	const x = plugin({ pathPattern: "./{language}.json" })(env)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en"]
	const resources = await config.readResources!({
		config: config as InlangConfig,
	})
	resources.push({
		type: "Resource",
		languageTag: {
			type: "LanguageTag",
			name: "de",
		},
		body: [],
	})

	await config.writeResources!({
		config: config as InlangConfig,
		resources: resources,
	})

	const newFile = (await env.$fs.readFile("./de.json", { encoding: "utf-8" })) as string
	const json = JSON.parse(newFile)
	expect(json).toStrictEqual({})
})

it("should add a new language for pathPattern with namespaces", async () => {
	const enResource = `{
    "test": "test"
}`

	const env = await mockEnvironment({})

	await env.$fs.mkdir("./en")
	await env.$fs.writeFile("./en/common.json", enResource)

	const x = plugin({
		pathPattern: { common: "./{language}/common.json" },
	})(env)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en"]
	const resources = await config.readResources!({
		config: config as InlangConfig,
	})
	resources.push({
		type: "Resource",
		languageTag: {
			type: "LanguageTag",
			name: "de",
		},
		body: [],
	})

	await config.writeResources!({
		config: config as InlangConfig,
		resources: resources,
	})

	const dir = await env.$fs.readdir("./de")
	expect(dir).toStrictEqual([])
})

it("should escape `.` in flattened json structures", async () => {
	const enResource = `{
    "test.": "test",
	"test.test": "test"
}`

	const env = await mockEnvironment({})

	await env.$fs.mkdir("./en")
	await env.$fs.writeFile("./en/common.json", enResource)

	const x = plugin({
		pathPattern: { common: "./{language}/common.json" },
	})(env)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en"]
	const resources = await config.readResources!({
		config: config as InlangConfig,
	})

	const reference = [
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "en",
			},
			body: [
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "common:test.",
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
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "common:test.test",
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
		},
	]

	expect(resources).toStrictEqual(reference)
})

it("should escape `.` in nested json structures", async () => {
	const enResource = `{
	"a.": {
		"b": "test"
	},
	"c.": "test"
}`

	const env = await mockEnvironment({})

	await env.$fs.mkdir("./en")
	await env.$fs.writeFile("./en/common.json", enResource)

	const x = plugin({
		pathPattern: { common: "./{language}/common.json" },
	})(env)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en"]
	const resources = await config.readResources!({
		config: config as InlangConfig,
	})

	const reference = [
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "en",
			},
			body: [
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "common:a..b",
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
				{
					type: "Message",
					id: {
						type: "Identifier",
						name: "common:c.",
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
		},
	]

	expect(resources).toStrictEqual(reference)

	await config.writeResources!({
		resources: resources,
		config: config as InlangConfig,
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

	const env = await mockEnvironment({})

	await env.$fs.writeFile("./en.json", withNesting)
	await env.$fs.writeFile("./fr.json", withNesting)
	await env.$fs.writeFile("./de.json", withoutNesting)

	const x = plugin({ pathPattern: "./{language}.json" })(env)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en", "de", "fr"]

	const resources = await config.readResources!({
		config: config as InlangConfig,
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
					name: "test.test",
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
		config: config as InlangConfig,
		resources,
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

it("should throw if element type is not known", async () => {
	const resources: ast.Resource[] = [
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "en",
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
								// @ts-ignore
								type: "FalseType",
								value: "test",
							},
						],
					},
				},
			],
		},
	]
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", "{}")

	const x = plugin({
		pathPattern: { common: "./{language}.json" },
	})(env)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en"]

	try {
		await config.writeResources!({
			resources: resources,
			config: config as InlangConfig,
		})
	} catch (e) {
		expect((e as Error).message).toContain("Unknown message pattern element of type")
	}
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
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", complexContent)

	const x = plugin({
		pathPattern: { common: "./{language}.json" },
	})(env)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en"]

	const resources = await config.readResources!({
		config: config as InlangConfig,
	})

	await config.writeResources!({
		resources: resources,
		config: config as InlangConfig,
	})

	const newResources = await config.readResources!({
		config: config as InlangConfig,
	})

	expect(newResources).toStrictEqual(resources)
})

it("should add default namespace if required by pathPattern", async () => {
	const resources: ast.Resource[] = [
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "en",
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
		},
	]
	const env = await mockEnvironment({})
	await env.$fs.writeFile("./en.json", "{}")

	const x = plugin({
		pathPattern: { common: "./{language}.json" },
	})(env)
	const config = await x.config({})
	config.referenceLanguage = "en"
	config.languages = ["en"]

	await config.writeResources!({
		resources: resources,
		config: config as InlangConfig,
	})

	const newResources = await config.readResources!({
		config: config as InlangConfig,
	})

	expect(newResources[0]?.body[0]?.id.name).toStrictEqual("common:test")
})

it("should not throw an error when read Resources with empty namespaces", async () => {
	const test = JSON.stringify({
		test: "test",
	})

	const env = await mockEnvironment({})
	await env.$fs.mkdir("./en")
	await env.$fs.mkdir("./de")
	await env.$fs.writeFile("./en/common.json", test)
	await env.$fs.writeFile("./en/vital.json", test)
	await env.$fs.writeFile("./de/common.json", test)

	const x = plugin({
		pathPattern: {
			common: "./{language}/common.json",
			vital: "./{language}/vital.json",
		},
	})(env)
	const config = await x.config({})
	config.referenceLanguage = "en"

	expect(config.languages).toStrictEqual(["en", "de"])

	let isThrown = false

	try {
		await config.readResources!({
			config: config as InlangConfig,
		})
	} catch (e) {
		isThrown = true
	}

	expect(isThrown).toBe(false)
})

it("should get the correct languages, when single namespace is defined as a pathPattern string 'pathPattern: `public/locales/{language}/translation.json`'", async () => {
	const test = JSON.stringify({
		test: "test",
	})

	const env = await mockEnvironment({})
	await env.$fs.mkdir("./en")
	await env.$fs.mkdir("./de")
	await env.$fs.writeFile("./en/common.json", test)
	await env.$fs.writeFile("./de/common.json", test)

	const x = plugin({
		pathPattern: "./{language}/common.json",
	})(env)
	const config = await x.config({})
	config.referenceLanguage = "en"

	expect(config.languages).toStrictEqual(["en", "de"])

	let isThrown = false

	try {
		await config.readResources!({
			config: config as InlangConfig,
		})
	} catch (e) {
		isThrown = true
	}

	expect(isThrown).toBe(false)
})
