import { describe, expect, it } from "vitest"
import { resolvePlugins } from "./resolvePlugins.js"
import {
	PluginFunctionLoadMessagesAlreadyDefinedError,
	PluginFunctionSaveMessagesAlreadyDefinedError,
	PluginUsesInvalidIdError,
	PluginUsesReservedNamespaceError,
	PluginAppSpecificApiReturnError,
	PluginUsesInvalidSchemaError,
	PluginFunctionDetectLanguageTagsAlreadyDefinedError,
} from "./errors.js"
import type { Plugin } from "./api.js"

describe("generally", () => {
	it("should return an error if a plugin uses an invalid id", async () => {
		const mockPlugin: Plugin = {
			meta: {
				// @ts-expect-error - invalid id
				id: "no-namespace",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
			addAppSpecificApi() {
				return {}
			},
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesInvalidIdError)
	})

	it("should return an error if a plugin uses APIs that are not available", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "namespace.pluginUndefinedApi",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			// @ts-expect-error the key is not available in type
			nonExistentKey: {
				nonexistentOptions: "value",
			},
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesInvalidSchemaError)
	})

	it("should not initialize a plugin that uses the 'inlang' namespace except for inlang whitelisted plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "inlang.pluginNotWhitelisted",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesReservedNamespaceError)
	})
})

describe("loadMessages", () => {
	it("should load messages from a local source", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "namespace.pluginPlaceholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: async () => [{ id: "test", expressions: [], selectors: [], body: { en: [] } }],
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(
			await resolved.data.loadMessages!({
				languageTags: ["en"],
			}),
		).toEqual([{ id: "test", expressions: [], selectors: [], body: { en: [] } }])
	})

	it("should collect an error if function is defined twice in multiple plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.pluginLoadMessagesFirst",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: async () => undefined as any,
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.pluginLoadMessagesSecond",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: async () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin, mockPlugin2],
			nodeishFs: {} as any,
			settings: {},
		})

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginFunctionLoadMessagesAlreadyDefinedError)
	})
})

describe("saveMessages", () => {
	it("should save messages to a local source", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.pluginPlaceholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			saveMessages: async () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			nodeishFs: {} as any,
			settings: {},
		})

		expect(resolved.errors).toHaveLength(0)
	})

	it("should collect an error if function is defined twice in multiple plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.pluginSaveMessages",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			saveMessages: async () => undefined as any,
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.pluginSaveMessages2",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},

			saveMessages: async () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin, mockPlugin2],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginFunctionSaveMessagesAlreadyDefinedError)
	})
})

describe("detectedLanguageTags", () => {
	it("should detect language tags from a local source", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.pluginDetectedLanguageTags",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: [],
			},
			detectedLanguageTags: async () => ["de", "en"],
			addAppSpecificApi: () => {
				return {}
			},
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.pluginDetectedLanguageTags2",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "detected-language-tags"],
			},
			addAppSpecificApi: () => {
				return {}
			},
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin, mockPlugin2],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.data.detectedLanguageTags).toBeDefined()
		expect(await resolved.data.detectedLanguageTags!()).toEqual(["de", "en"])
	})

	it("should collect an error if function is defined twice in multiple plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.pluginDetectedLanguageTags",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "detected-language-tags"],
			},
			detectedLanguageTags: async () => ["de", "en"],
			addAppSpecificApi: () => {
				return {}
			},
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.pluginDetectedLanguageTags2",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "detected-language-tags"],
			},
			detectedLanguageTags: async () => ["de", "en"],
			addAppSpecificApi: () => {
				return {}
			},
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin, mockPlugin2],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginFunctionDetectLanguageTagsAlreadyDefinedError)
	})
})

describe("addAppSpecificApi", () => {
	it("it should resolve app specific api", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.pluginPlaceholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},

			addAppSpecificApi: () => ({
				"my-app": {
					messageReferenceMatcher: () => undefined as any,
				},
			}),
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.data.appSpecificApi).toHaveProperty("my-app")
	})

	it("it should resolve multiple app specific apis", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.pluginPlaceholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			addAppSpecificApi: () => ({
				"my-app-1": {
					functionOfMyApp1: () => undefined as any,
				},
				"my-app-2": {
					functionOfMyApp2: () => undefined as any,
				},
			}),
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.pluginPlaceholder2",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},

			addAppSpecificApi: () => ({
				"my-app-3": {
					functionOfMyApp3: () => undefined as any,
				},
			}),
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin, mockPlugin2],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.data.appSpecificApi).toHaveProperty("my-app-1")
		expect(resolved.data.appSpecificApi).toHaveProperty("my-app-2")
		expect(resolved.data.appSpecificApi).toHaveProperty("my-app-3")
	})

	it("it should throw an error if return value is not an object", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.pluginPlaceholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: [],
			},
			// @ts-expect-error - invalid return type
			addAppSpecificApi: () => undefined,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginAppSpecificApiReturnError)
	})

	it("it should throw an error if the passed options are not defined inside appSpecificApi", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.pluginPlaceholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: [],
			},
			addAppSpecificApi: () => ({
				"namespace.myApp": {
					messageReferenceMatcher: () => {
						return { hello: "world" }
					},
				},
			}),
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.data.appSpecificApi).toHaveProperty("namespace.myApp")
		expect(resolved.data.appSpecificApi?.["namespace.myApp"].messageReferenceMatcher()).toEqual({
			hello: "world",
		})
	})
})

describe("meta", () => {
	it("should resolve meta data", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "namespace.pluginPlaceholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
		}

		const resolved = resolvePlugins({
			plugins: [mockPlugin],
			nodeishFs: {} as any,
			settings: {},
		})

		expect(resolved.data.meta).toHaveProperty(mockPlugin.meta.id)
	})

	it("should resolve meta data from multiple plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.pluginPlaceholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: [],
			},
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.pluginPlaceholder2",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: [],
			},
			addAppSpecificApi: () => ({
				"my-app-1": {
					functionOfMyApp1: () => undefined as any,
				},
			}),
		}

		const resolved = resolvePlugins({
			plugins: [mockPlugin, mockPlugin2],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.data.meta).toHaveProperty(mockPlugin.meta.id)
		expect(resolved.data.meta).toHaveProperty(mockPlugin2.meta.id)
	})
})
