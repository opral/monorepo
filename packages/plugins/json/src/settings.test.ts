/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from "vitest"
// import { Message, ProjectSettings, Variant, createVariant, getVariant } from "@inlang/sdk"
import { plugin } from "./plugin.js"
// import { createNodeishMemoryFs } from "@lix-js/fs"
import { Value } from "@sinclair/typebox/value"

// const pluginId = "plugin.inlang.json"

test("valid path patterns", async () => {
	// TODO add test for ./ at the beginning or ../ ( relative path not an absolute path )
	const validPathPatterns = [
		"{languageTag}.json",
		"{languageTag}examplerFolder/ExampleFile.json",
		"folder/{languageTag}/ExamplePath.json",
		"folder/ExamplePath{languageTag}ExamplePath.json",
		"folder/Example{languageTag}Path.json",
	]

	for (const pathPattern of validPathPatterns) {
		const isValid = Value.Check(plugin.settingsSchema, {
			pathPattern,
		})
		expect(isValid).toBe(true)
	}
})
test("should throw if path patter does not include the word `{languageTag}`", async () => {
	const pathPattern = "examplePath.json"

	const isValid = Value.Check(plugin.settingsSchema, {
		pathPattern,
	})
	expect(isValid).toBe(false)
})
test("should throw if path patte end not with .json", async () => {
	const pathPattern = "{languageTag}."

	const isValid = Value.Check(plugin.settingsSchema, {
		pathPattern,
	})
	expect(isValid).toBe(false)
})
test("should throw if curly brackets {} doesn't to cointain the word languageTag", async () => {
	const pathPattern = "{en}.json"

	const isValid = Value.Check(plugin.settingsSchema, {
		pathPattern,
	})
	expect(isValid).toBe(false)
})
test("should throw if pathPattern includes a '*' wildcard. This was depricated in version 3.0.0.", async () => {
	const pathPattern = "{languageTag}/*.json"
	const isValid = Value.Check(plugin.settingsSchema, {
		pathPattern,
	})
	expect(isValid).toBe(false)
})
test("should throw if namespaces include a incorrect pathpattern", async () => {
	const pathPattern = {
		website: "./resources/{}/website/*.json",
		app: "./resources/{languageTag}/app.json",
		footer: "./resources/{languageTag}/*.json",
	}
	const isValid = Value.Check(plugin.settingsSchema, {
		pathPattern,
	})
	expect(isValid).toBe(true)
})

test("should throw if a normal JSON Schema is not working", async () => {
	const jsonSchema = {
		$schema: "http://json-schema.org/draft-04/schema#",
		type: "object",
		properties: {
			pathpattern: {
				type: "string",
			},
		},
		required: ["pathpattern"],
	}
	// @ts-ignore
	const isValid = Value.Check(jsonSchema, { pathPattern: "./resources/{}/website.json" })
	expect(isValid).toBe(true)
})

// TODO Write test for the namespace/ write the correct type for that
// describe("")
// it("should throw if the path pattern uses double curly brackets for {languageTag} variable reference", async () => {
// 	const fs = createNodeishMemoryFs()
// 	await fs.writeFile("./en.json", "{}")
// 	try {
// 		await plugin.loadMessages!({
// 			settings: {
// 				modules: [],
// 				sourceLanguageTag: "en",
// 				languageTags: ["en"],
// 				[pluginId]: { pathPattern: "./{{languageTag}}.json" } satisfies PluginSettings,
// 			} satisfies ProjectSettings,
// 			nodeishFs: fs,
// 		})
// 		throw new Error("should not reach this")
// 	} catch (e) {
// 		expect((e as Error).message).toContain("pathPattern")
// 	}
// })

// it("should throw if the path pattern with namespaces uses double curly brackets for {languageTag} variable reference", async () => {
// 	const fs = createNodeishMemoryFs()
// 	await fs.writeFile("./en.json", "{}")
// 	try {
// 		await plugin.loadMessages!({
// 			settings: {
// 				modules: [],
// 				languageTags: ["en"],
// 				sourceLanguageTag: "en",
// 				[pluginId]: {
// 					pathPattern: {
// 						common: "./{{languageTag}}.json",
// 					},
// 				} satisfies PluginSettings,
// 			} satisfies ProjectSettings,
// 			nodeishFs: fs,
// 		})
// 		throw new Error("should not reach this")
// 	} catch (e) {
// 		expect((e as Error).message).toContain("pathPattern")
// 	}
// })

// it("should throw if the path pattern with namespaces does not end with '.json'", async () => {
// 	const fs = createNodeishMemoryFs()
// 	await fs.writeFile("./en.json", "{}")
// 	try {
// 		await plugin.loadMessages!({
// 			settings: {
// 				modules: [],
// 				languageTags: ["en"],
// 				sourceLanguageTag: "en",
// 				[pluginId]: {
// 					pathPattern: {
// 						common: "./{languageTag}/common",
// 					},
// 				} satisfies PluginSettings,
// 			} satisfies ProjectSettings,
// 			nodeishFs: fs,
// 		})
// 		throw new Error("should not reach this")
// 	} catch (e) {
// 		expect((e as Error).message).toContain("pathPattern")
// 	}
// })

// it("should throw if the path pattern with namespaces has a namespace with a dot", async () => {
// 	const fs = createNodeishMemoryFs()
// 	await fs.writeFile("./en.json", "{}")
// 	try {
// 		await plugin.loadMessages!({
// 			settings: {
// 				modules: [],
// 				languageTags: ["en"],
// 				sourceLanguageTag: "en",
// 				[pluginId]: {
// 					pathPattern: {
// 						"namespaceWith.dot": "./{languageTag}/common.json",
// 					},
// 				} satisfies PluginSettings,
// 			} satisfies ProjectSettings,
// 			nodeishFs: fs,
// 		})
// 		throw new Error("should not reach this")
// 	} catch (e) {
// 		expect((e as Error).message).toContain("pathPattern")
// 	}
// })
