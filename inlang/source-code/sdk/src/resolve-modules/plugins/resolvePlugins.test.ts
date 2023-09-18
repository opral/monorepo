/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { describe, expect, it } from "vitest"
import { resolvePlugins } from "./resolvePlugins.js"
import {
	PluginLoadMessagesFunctionAlreadyDefinedError,
	PluginSaveMessagesFunctionAlreadyDefinedError,
	PluginHasInvalidIdError,
	PluginUsesReservedNamespaceError,
	PluginReturnedInvalidCustomApiError,
	PluginHasInvalidSchemaError,
	PluginsDoNotProvideLoadOrSaveMessagesError,
} from "./errors.js"
import type { Plugin } from "@inlang/plugin"

describe("generally", () => {
	it("should return an error if a plugin uses an invalid id", async () => {
		const mockPlugin: Plugin = {
			// @ts-expect-error - invalid id
			id: "no-namespace",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.errors[0]).toBeInstanceOf(PluginHasInvalidIdError)
	})

	it("should return an error if a plugin uses APIs that are not available", async () => {
		const mockPlugin: Plugin = {
			id: "plugin.namespace.undefinedApi",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
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

		expect(resolved.errors[0]).toBeInstanceOf(PluginHasInvalidSchemaError)
	})

	it("should not initialize a plugin that uses the 'inlang' namespace except for inlang whitelisted plugins", async () => {
		const mockPlugin: Plugin = {
			id: "plugin.inlang.notWhitelisted",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			loadMessages: () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesReservedNamespaceError)
	})
})

describe("loadMessages", () => {
	it("should load messages from a local source", async () => {
		const mockPlugin: Plugin = {
			id: "plugin.namespace.placeholder",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			loadMessages: async () => [{ id: "test", expressions: [], selectors: [], variants: [] }],
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(
			await resolved.data.loadMessages!({
				languageTags: ["en"],
				sourceLanguageTag: "en",
			}),
		).toEqual([{ id: "test", expressions: [], selectors: [], variants: [] }])
	})

	it("should collect an error if function is defined twice in multiple plugins", async () => {
		const mockPlugin: Plugin = {
			id: "plugin.namepsace.loadMessagesFirst",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			loadMessages: async () => undefined as any,
		}
		const mockPlugin2: Plugin = {
			id: "plugin.namepsace.loadMessagesSecond",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			loadMessages: async () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin, mockPlugin2],
			nodeishFs: {} as any,
			settings: {},
		})

		expect(resolved.errors[0]).toBeInstanceOf(PluginLoadMessagesFunctionAlreadyDefinedError)
	})

	it("should return an error if no plugin defines loadMessages", async () => {
		const mockPlugin: Plugin = {
			id: "plugin.namepsace.loadMessagesFirst",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			saveMessages: async () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			nodeishFs: {} as any,
			settings: {},
		})

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginsDoNotProvideLoadOrSaveMessagesError)
	})
})

describe("saveMessages", () => {
	it("should save messages to a local source", async () => {
		const mockPlugin: Plugin = {
			id: "plugin.namespace.placeholder",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			loadMessages: async () => undefined as any,
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
			id: "plugin.namepsace.saveMessages",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			saveMessages: async () => undefined as any,
		}
		const mockPlugin2: Plugin = {
			id: "plugin.namepsace.saveMessages2",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },

			saveMessages: async () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin, mockPlugin2],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.errors[0]).toBeInstanceOf(PluginSaveMessagesFunctionAlreadyDefinedError)
	})

	it("should return an error if no plugin defines saveMessages", async () => {
		const mockPlugin: Plugin = {
			id: "plugin.namepsace.loadMessagesFirst",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			loadMessages: async () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			nodeishFs: {} as any,
			settings: {},
		})
		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginsDoNotProvideLoadOrSaveMessagesError)
	})
})

describe("detectedLanguageTags", () => {
	it("should merge language tags from plugins", async () => {
		const mockPlugin: Plugin = {
			id: "plugin.namepsace.detectedLanguageTags",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			detectedLanguageTags: async () => ["de", "en"],
			addCustomApi: () => {
				return {}
			},
		}
		const mockPlugin2: Plugin = {
			id: "plugin.namepsace.detectedLanguageTags2",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			addCustomApi: () => {
				return {}
			},
			detectedLanguageTags: async () => ["de", "fr"],
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin, mockPlugin2],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.data.detectedLanguageTags).toEqual(["de", "en", "fr"])
	})
})

describe("addCustomApi", () => {
	it("it should resolve app specific api", async () => {
		const mockPlugin: Plugin = {
			id: "plugin.namespace.placeholder",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },

			addCustomApi: () => ({
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

		expect(resolved.data.customApi).toHaveProperty("my-app")
	})

	it("it should resolve multiple app specific apis", async () => {
		const mockPlugin: Plugin = {
			id: "plugin.namespace.placeholder",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			addCustomApi: () => ({
				"my-app-1": {
					functionOfMyApp1: () => undefined as any,
				},
				"my-app-2": {
					functionOfMyApp2: () => undefined as any,
				},
			}),
		}
		const mockPlugin2: Plugin = {
			id: "plugin.namespace.placeholder2",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },

			addCustomApi: () => ({
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

		expect(resolved.data.customApi).toHaveProperty("my-app-1")
		expect(resolved.data.customApi).toHaveProperty("my-app-2")
		expect(resolved.data.customApi).toHaveProperty("my-app-3")
	})

	it("it should throw an error if return value is not an object", async () => {
		const mockPlugin: Plugin = {
			id: "plugin.namespace.placeholder",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			// @ts-expect-error - invalid return type
			addCustomApi: () => undefined,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.errors[0]).toBeInstanceOf(PluginReturnedInvalidCustomApiError)
	})

	it("it should throw an error if the passed options are not defined inside customApi", async () => {
		const mockPlugin: Plugin = {
			id: "plugin.namepsace.placeholder",
			description: { en: "My plugin description" },
			displayName: { en: "My plugin" },
			addCustomApi: () => ({
				"app.inlang.placeholder": {
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

		expect(resolved.data.customApi).toHaveProperty("app.inlang.placeholder")
		expect(
			(resolved.data.customApi?.["app.inlang.placeholder"] as any).messageReferenceMatcher(),
		).toEqual({
			hello: "world",
		})
	})
})
