import { describe, expect, it } from "vitest"
import { resolvePlugins } from "./resolvePlugins.js"
import {
	PluginLoadMessagesFunctionAlreadyDefinedError,
	PluginSaveMessagesFunctionAlreadyDefinedError,
	PluginHasInvalidIdError,
	PluginUsesReservedNamespaceError,
	PluginReturnedInvalidAppSpecificApiError,
	PluginHasInvalidSchemaError,
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

		expect(resolved.errors[0]).toBeInstanceOf(PluginHasInvalidIdError)
	})

	it("should return an error if a plugin uses APIs that are not available", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "namespace.plugin.undefinedApi",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
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
		expect(resolved.errors[0]).toBeInstanceOf(PluginHasInvalidSchemaError)
	})

	it("should not initialize a plugin that uses the 'inlang' namespace except for inlang whitelisted plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "inlang.plugin.notWhitelisted",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
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
				id: "namespace.plugin.placeholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
			},
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
			}),
		).toEqual([{ id: "test", expressions: [], selectors: [], variants: [] }])
	})

	it("should collect an error if function is defined twice in multiple plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin.loadMessagesFirst",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
			},
			loadMessages: async () => undefined as any,
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.plugin.loadMessagesSecond",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
			},
			loadMessages: async () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin, mockPlugin2],
			nodeishFs: {} as any,
			settings: {},
		})

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginLoadMessagesFunctionAlreadyDefinedError)
	})
})

describe("saveMessages", () => {
	it("should save messages to a local source", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "namespace.plugin.placeholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
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
				id: "plugin.plugin.saveMessages",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
			},
			saveMessages: async () => undefined as any,
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.plugin.saveMessages2",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
			},

			saveMessages: async () => undefined as any,
		}

		const resolved = await resolvePlugins({
			plugins: [mockPlugin, mockPlugin2],
			settings: {},
			nodeishFs: {} as any,
		})

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginSaveMessagesFunctionAlreadyDefinedError)
	})
})

describe("detectedLanguageTags", () => {
	it("should merge language tags from plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin.detectedLanguageTags",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
			},
			detectedLanguageTags: async () => ["de", "en"],
			addAppSpecificApi: () => {
				return {}
			},
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.plugin.detectedLanguageTags2",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
			},
			addAppSpecificApi: () => {
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

describe("addAppSpecificApi", () => {
	it("it should resolve app specific api", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "namespace.plugin.placeholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
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
				id: "namespace.plugin.placeholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
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
				id: "namespace.plugin.placeholder2",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
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
				id: "namespace.plugin.placeholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
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
		expect(resolved.errors[0]).toBeInstanceOf(PluginReturnedInvalidAppSpecificApiError)
	})

	it("it should throw an error if the passed options are not defined inside appSpecificApi", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "namespace.plugin.placeholder",
				description: { en: "My plugin description" },
				displayName: { en: "My plugin" },
			},
			addAppSpecificApi: () => ({
				"namespace.app.placeholder": {
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

		expect(resolved.data.appSpecificApi).toHaveProperty("namespace.app.placeholder")
		expect(
			(
				resolved.data.appSpecificApi?.["namespace.app.placeholder"] as any
			).messageReferenceMatcher(),
		).toEqual({
			hello: "world",
		})
	})
})
