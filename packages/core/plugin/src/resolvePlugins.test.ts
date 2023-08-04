import { describe, expect, it } from "vitest"
import { resolvePlugins } from "./resolvePlugins.js"
import type { InlangConfig } from "@inlang/config"
import {
	PluginFunctionLoadMessagesAlreadyDefinedError,
	PluginFunctionSaveMessagesAlreadyDefinedError,
	PluginUsesInvalidIdError,
	PluginUsesReservedNamespaceError,
	PluginAppSpecificApiReturnError,
	PluginUsesInvalidSchemaError,
} from "./errors.js"
import type { Plugin } from "./api.js"

describe("generally", () => {
	it("should return an error if a plugin uses an invalid id", async () => {
		const mockPlugin: Plugin = {
			meta: {
				// @ts-expect-error the id is invalid
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

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
		})

		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesInvalidIdError)
	})

	it("should return an error if a plugin uses APIs that are not available", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.undefined-api",
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

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
		})

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesInvalidSchemaError)
	})

	it("should not initialize a plugin that uses the 'inlang' namespace except for inlang whitelisted plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "inlang.not-whitelisted-plugin",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: () => undefined as any,
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
		})

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesReservedNamespaceError)
	})
})

describe("loadMessages", () => {
	it("should load messages from a local source", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: async () => [{ id: "test", expressions: [], selectors: [], body: { en: [] } }],
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
		})

		expect(
			await resolved.data.loadMessages!({
				languageTags: ["en"],
				options: {},
				nodeishFs: {} as any,
			}),
		).toEqual([{ id: "test", expressions: [], selectors: [], body: { en: [] } }])
	})

	it("should collect an error if function is defined twice in multiple plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin-load-messages-first",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},

			loadMessages: async () => undefined as any,
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.plugin-load-messages-second",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: async () => undefined as any,
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin5.com/index.js", "https://myplugin6.com/index.js"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin, mockPlugin2],
			pluginSettings: {},
		})

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginFunctionLoadMessagesAlreadyDefinedError)
	})
})

describe("saveMessages", () => {
	it("should save messages to a local source", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			saveMessages: async () => undefined as any,
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
		})

		expect(resolved.errors).toHaveLength(0)
	})

	it("should collect an error if function is defined twice in multiple plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin-save-messages",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			saveMessages: async () => undefined as any,
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.plugin-save-messages2",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},

			saveMessages: async () => undefined as any,
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin5.com/index.js", "https://myplugin6.com/index.js"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin, mockPlugin2],
			pluginSettings: {},
		})

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginFunctionSaveMessagesAlreadyDefinedError)
	})
})

describe("addAppSpecificApi", () => {
	it("it should resolve app specific api", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
			addAppSpecificApi: () => ({
				"my-app": {
					messageReferenceMatcher: () => undefined as any,
				},
			}),
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
		})

		expect(resolved.data.appSpecificApi).toHaveProperty("my-app")
	})

	it("it should resolve multiple app specific apis", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin",
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
				id: "plugin.plugin2",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
			addAppSpecificApi: () => ({
				"my-app-3": {
					functionOfMyApp3: () => undefined as any,
				},
			}),
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin5.com/index.js", "https://myplugin6.com/index.js"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin, mockPlugin2],
			pluginSettings: {},
		})

		expect(resolved.data.appSpecificApi).toHaveProperty("my-app-1")
		expect(resolved.data.appSpecificApi).toHaveProperty("my-app-2")
		expect(resolved.data.appSpecificApi).toHaveProperty("my-app-3")
	})

	it("it should throw an error if return value is not an object", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
			addAppSpecificApi: () => undefined as any,
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
		})

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginAppSpecificApiReturnError)
	})

	it("it should throw an error if the passed options are not defined inside appSpecificApi", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
			addAppSpecificApi: ({ options = { hello: "world" } }) => ({
				"my-app": {
					messageReferenceMatcher: () => {
						return options
					},
				},
			}),
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js?pathPattern=src/**/*.{ts,tsx}"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
		})

		expect(resolved.data.appSpecificApi).toHaveProperty("my-app")
		// @ts-expect-error messageReferenceMatcher is not known to typescript
		expect(resolved.data.appSpecificApi?.["my-app"].messageReferenceMatcher()).toEqual({
			hello: "world",
		})
	})
})

describe("meta", () => {
	it("should resolve meta data", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
			addAppSpecificApi: () => {
				return {}
			},
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {
				"plugin.plugin": {
					options: {
						"my-app-1": {
							option1: "value1",
						},
						"my-app-2": {
							option2: "value2",
						},
					},
				},
			},
		})

		expect(resolved.data.meta).toHaveProperty("plugin.plugin")
	})

	it("should resolve meta data from multiple plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
			addAppSpecificApi: () => {
				return {}
			},
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.plugin2",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
				keywords: ["plugin", "my-plugin"],
			},
			addAppSpecificApi: () => ({
				"my-app-1": {
					functionOfMyApp1: () => undefined as any,
				},
			}),
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js", "https://myplugin2.com/index.js"],
		}

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin, mockPlugin2],
			pluginSettings: {},
		})

		expect(resolved.data.meta).toHaveProperty("plugin.plugin")
		expect(resolved.data.meta).toHaveProperty("plugin.plugin2")
	})
})
