/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { expect, test } from "vitest"
import type { PluginSettings } from "./settings.js"
// import { Message, ProjectSettings, Variant, createVariant, getVariant } from "@inlang/sdk"
import { plugin } from "./plugin.js"
// import { createNodeishMemoryFs } from "@lix-js/fs"
import { Value } from "@sinclair/typebox/value"

// const pluginId = "plugin.inlang.json"

test("valid path patterns", async () => {
	const validPathPatterns = [
		"{languageTag}.json",
		"{languageTag}examplerFolder/ExamplePath.json",
		"examplerFolder/{languageTag}/ExamplePath.json",
		"examplerFolder/ExamplePath{languageTag}ExamplePath.json",
		"examplerFolder/Example{languageTag}Path.json",
	]

	for (const pathPattern of validPathPatterns) {
		const isValid = Value.Check(plugin.settingSchema, {
			pathPattern,
		} satisfies PluginSettings)
		expect(isValid).toBe(true)
	}
})
test("path patter needs to include the word `{languageTag}`", async () => {
	const validPathPatterns = ["examplePath.json"]

	for (const pathPattern of validPathPatterns) {
		const isValid = Value.Check(plugin.settingSchema, {
			pathPattern,
		} satisfies PluginSettings)
		expect(isValid).toBe(false)
	}
})
test("path patter need to end with .json ", async () => {
	const validPathPatterns = ["{languageTag}"]

	for (const pathPattern of validPathPatterns) {
		const isValid = Value.Check(plugin.settingSchema, {
			pathPattern,
		} satisfies PluginSettings)
		expect(isValid).toBe(false)
	}
})
test("the {} has to cointain the word `languageTag", async () => {
	const validPathPatterns = ["{en}"]

	for (const pathPattern of validPathPatterns) {
		const isValid = Value.Check(plugin.settingSchema, {
			pathPattern,
		} satisfies PluginSettings)
		expect(isValid).toBe(true)
	}
})

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

// it("should throw if the path pattern string does not end with '.json'", async () => {
// 	const fs = createNodeishMemoryFs()
// 	await fs.writeFile("./en.json", "{}")
// 	try {
// 		await plugin.loadMessages!({
// 			settings: {
// 				modules: [],
// 				sourceLanguageTag: "en",
// 				languageTags: ["en"],
// 				[pluginId]: { pathPattern: "./{lanugageTag}/resources/" } satisfies PluginSettings,
// 			} satisfies ProjectSettings,
// 			nodeishFs: fs,
// 		})
// 		throw new Error("should not reach this")
// 	} catch (e) {
// 		expect((e as Error).message).toContain("pathPattern")
// 	}
// })

// it("should throw if the path pattern with namespaces does not include the {languageTag} variable reference", async () => {
// 	const fs = createNodeishMemoryFs()
// 	await fs.writeFile("./en.json", "{}")
// 	try {
// 		await plugin.loadMessages!({
// 			settings: {
// 				modules: [],
// 				sourceLanguageTag: "en",
// 				languageTags: ["en"],
// 				[pluginId]: { pathPattern: "./common.json" } satisfies PluginSettings,
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

// it("should throw if the path pattern includes wildcard", async () => {
// 	const fs = createNodeishMemoryFs()
// 	await fs.writeFile("./en.json", "{}")
// 	try {
// 		await plugin.loadMessages!({
// 			settings: {
// 				modules: [],
// 				languageTags: ["en"],
// 				sourceLanguageTag: "en",
// 				[pluginId]: {
// 					pathPattern: "./{languageTag}/*.json",
// 				} satisfies PluginSettings,
// 			} satisfies ProjectSettings,
// 			nodeishFs: fs,
// 		})
// 		throw new Error("should not reach this")
// 	} catch (e) {
// 		expect((e as Error).message).toContain("pathPattern")
// 	}
// })
// describe("option pathPattern", () => {
// 	it("should throw if the path pattern does not include the {languageTag} variable reference", async () => {
// 		const fs = createNodeishMemoryFs()
// 		await fs.writeFile("./en.json", "{}")
// 		try {
// 			await plugin.loadMessages!({
// 				settings: {
// 					modules: [],
// 					sourceLanguageTag: "en",
// 					languageTags: ["en"],
// 					[pluginId]: { pathPattern: "./resources/" } satisfies PluginSettings,
// 				} satisfies ProjectSettings,
// 				nodeishFs: fs,
// 			})
// 			throw new Error("should not reach this")
// 		} catch (e) {
// 			expect((e as Error).message).toContain("pathPattern")
// 		}
// 	})

// 	it("should throw if the path pattern uses double curly brackets for {languageTag} variable reference", async () => {
// 		const fs = createNodeishMemoryFs()
// 		await fs.writeFile("./en.json", "{}")
// 		try {
// 			await plugin.loadMessages!({
// 				settings: {
// 					modules: [],
// 					sourceLanguageTag: "en",
// 					languageTags: ["en"],
// 					[pluginId]: { pathPattern: "./{{languageTag}}.json" } satisfies PluginSettings,
// 				} satisfies ProjectSettings,
// 				nodeishFs: fs,
// 			})
// 			throw new Error("should not reach this")
// 		} catch (e) {
// 			expect((e as Error).message).toContain("pathPattern")
// 		}
// 	})

// 	it("should throw if the path pattern string does not end with '.json'", async () => {
// 		const fs = createNodeishMemoryFs()
// 		await fs.writeFile("./en.json", "{}")
// 		try {
// 			await plugin.loadMessages!({
// 				settings: {
// 					modules: [],
// 					sourceLanguageTag: "en",
// 					languageTags: ["en"],
// 					[pluginId]: { pathPattern: "./{lanugageTag}/resources/" } satisfies PluginSettings,
// 				} satisfies ProjectSettings,
// 				nodeishFs: fs,
// 			})
// 			throw new Error("should not reach this")
// 		} catch (e) {
// 			expect((e as Error).message).toContain("pathPattern")
// 		}
// 	})

// 	it("should throw if the path pattern with namespaces does not include the {languageTag} variable reference", async () => {
// 		const fs = createNodeishMemoryFs()
// 		await fs.writeFile("./en.json", "{}")
// 		try {
// 			await plugin.loadMessages!({
// 				settings: {
// 					modules: [],
// 					sourceLanguageTag: "en",
// 					languageTags: ["en"],
// 					[pluginId]: { pathPattern: "./common.json" } satisfies PluginSettings,
// 				} satisfies ProjectSettings,
// 				nodeishFs: fs,
// 			})
// 			throw new Error("should not reach this")
// 		} catch (e) {
// 			expect((e as Error).message).toContain("pathPattern")
// 		}
// 	})

// 	it("should throw if the path pattern with namespaces uses double curly brackets for {languageTag} variable reference", async () => {
// 		const fs = createNodeishMemoryFs()
// 		await fs.writeFile("./en.json", "{}")
// 		try {
// 			await plugin.loadMessages!({
// 				settings: {
// 					modules: [],
// 					languageTags: ["en"],
// 					sourceLanguageTag: "en",
// 					[pluginId]: {
// 						pathPattern: {
// 							common: "./{{languageTag}}.json",
// 						},
// 					} satisfies PluginSettings,
// 				} satisfies ProjectSettings,
// 				nodeishFs: fs,
// 			})
// 			throw new Error("should not reach this")
// 		} catch (e) {
// 			expect((e as Error).message).toContain("pathPattern")
// 		}
// 	})

// 	it("should throw if the path pattern with namespaces does not end with '.json'", async () => {
// 		const fs = createNodeishMemoryFs()
// 		await fs.writeFile("./en.json", "{}")
// 		try {
// 			await plugin.loadMessages!({
// 				settings: {
// 					modules: [],
// 					languageTags: ["en"],
// 					sourceLanguageTag: "en",
// 					[pluginId]: {
// 						pathPattern: {
// 							common: "./{languageTag}/common",
// 						},
// 					} satisfies PluginSettings,
// 				} satisfies ProjectSettings,
// 				nodeishFs: fs,
// 			})
// 			throw new Error("should not reach this")
// 		} catch (e) {
// 			expect((e as Error).message).toContain("pathPattern")
// 		}
// 	})

// 	it("should throw if the path pattern with namespaces has a namespace with a dot", async () => {
// 		const fs = createNodeishMemoryFs()
// 		await fs.writeFile("./en.json", "{}")
// 		try {
// 			await plugin.loadMessages!({
// 				settings: {
// 					modules: [],
// 					languageTags: ["en"],
// 					sourceLanguageTag: "en",
// 					[pluginId]: {
// 						pathPattern: {
// 							"namespaceWith.dot": "./{languageTag}/common.json",
// 						},
// 					} satisfies PluginSettings,
// 				} satisfies ProjectSettings,
// 				nodeishFs: fs,
// 			})
// 			throw new Error("should not reach this")
// 		} catch (e) {
// 			expect((e as Error).message).toContain("pathPattern")
// 		}
// 	})

// 	it("should throw if the path pattern includes wildcard", async () => {
// 		const fs = createNodeishMemoryFs()
// 		await fs.writeFile("./en.json", "{}")
// 		try {
// 			await plugin.loadMessages!({
// 				settings: {
// 					modules: [],
// 					languageTags: ["en"],
// 					sourceLanguageTag: "en",
// 					[pluginId]: {
// 						pathPattern: "./{languageTag}/*.json",
// 					} satisfies PluginSettings,
// 				} satisfies ProjectSettings,
// 				nodeishFs: fs,
// 			})
// 			throw new Error("should not reach this")
// 		} catch (e) {
// 			expect((e as Error).message).toContain("pathPattern")
// 		}
// 	})
// })
