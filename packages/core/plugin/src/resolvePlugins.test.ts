import { describe, expect, it, vi } from "vitest"
import { resolvePlugins } from "./resolvePlugins.js"
import type { InlangConfig } from "@inlang/config"
import {
	PluginException,
	PluginFunctionLoadMessagesAlreadyDefinedException,
	PluginFunctionSaveMessagesAlreadyDefinedException,
	PluginImportException,
	PluginIncorrectlyDefinedUsedApisException,
	PluginInvalidIdException,
	PluginUsesReservedNamespaceException,
	PluginUsesUnavailableApiException,
} from "./errors.js"
import type { InlangEnvironment } from "@inlang/environment"
import type { PluginApi } from "./api.js"

describe("generally", () => {
	it("should return an error if a plugin cannot be imported", async () => {
		const resolved = await resolvePlugins({
			env: {
				$fs: {} as any,
				$import: () => {
					throw Error("Could not import")
				},
			},
			config: {
				plugins: [{ module: "https://myplugin.com/index.js", options: {} }],
			} as InlangConfig,
		})

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginImportException)
	})

	it("should return an error if a plugin uses an invalid id", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				// @ts-expect-error the id is invalid
				id: "no-namespace",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: [],
			},
			setup: () => {
				return {
					loadMessages: () => undefined as any,
					saveMessages: () => undefined as any,
					addAppSpecificApi() {
						return undefined as any
					},
					addLintRules() {
						return undefined as any
					},
				}
			},
		}
		const pluginModule = "https://myplugin.com/index.js"
		const env = mockEnvWithPlugins({ [pluginModule]: mockPlugin })
		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				] satisfies InlangConfig["plugins"],
			} as unknown as InlangConfig,
		})
		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginInvalidIdException)
	})

	it("should return an error if a plugin uses APIs that are not available", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.my-plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				// @ts-expect-error plugin is using an API that is not available
				usedApis: ["nonExistentApi"],
			},
			// @ts-expect-error
			setup: () => {
				return {
					nonExistentApi: () => undefined as any,
				}
			},
		}

		const pluginModule = "https://myplugin.com/index.js"
		const env = mockEnvWithPlugins({ [pluginModule]: mockPlugin })

		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				] satisfies InlangConfig["plugins"],
			} as unknown as InlangConfig,
		})

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesUnavailableApiException)
	})

	it("should return an error if a plugin uses APIs that are not defined in meta.usedApis", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: [], // Empty list of used APIs
			},
			setup: () => {
				return {
					loadMessages: () => undefined as any,
				}
			},
		}

		const pluginModule = "https://myplugin2.com/index.js"
		const env = mockEnvWithPlugins({ [pluginModule]: mockPlugin })

		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				] satisfies InlangConfig["plugins"],
			} as unknown as InlangConfig,
		})

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginIncorrectlyDefinedUsedApisException)
	})

	it("should return an error if a plugin DOES NOT use APIs that are defined in meta.usedApis", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["loadMessages"],
			},
			setup: () => {
				return {
					saveMessages(args) {
						return undefined as any
					},
				}
			},
		}

		const pluginModule = "https://myplugin3.com/index.js"
		const env = mockEnvWithPlugins({ [pluginModule]: mockPlugin })
		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				] satisfies InlangConfig["plugins"],
			} as unknown as InlangConfig,
		})

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginIncorrectlyDefinedUsedApisException)
	})

	it("should not initialize a plugin that uses the 'inlang' namespace except for inlang whitelisted plugins", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "inlang.not-whitelisted-plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["loadMessages"],
			},
			setup: () => {
				return {
					loadMessages: () => undefined as any,
				}
			},
		}

		const pluginModule = "https://inlangwhitelist.com/index.js"
		const env = mockEnvWithPlugins({ [pluginModule]: mockPlugin })

		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				] satisfies InlangConfig["plugins"],
			} as unknown as InlangConfig,
		})

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesReservedNamespaceException)
	})
})

describe("loadMessages", () => {
	it("should load messages from a local source", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["loadMessages"],
			},
			setup: () => {
				return {
					loadMessages: async () => [
						{ id: "test", expressions: [], selectors: [], body: { en: [] } },
					],
				}
			},
		}
		const pluginModule = "https://myplugin4.com/index.js"
		const env = mockEnvWithPlugins({ [pluginModule]: mockPlugin })

		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				],
			} as unknown as InlangConfig,
		})

		expect(resolved.errors).toHaveLength(0)
	})

	it("should collect an error if function is defined twice in multiple plugins", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin-load-messages",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["loadMessages"],
			},
			setup: () => {
				return {
					loadMessages: async () => undefined as any,
				}
			},
		}
		const mockPlugin2: PluginApi = {
			meta: {
				id: "plugin.plugin-load-messages2",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["loadMessages"],
			},
			setup: () => {
				return {
					loadMessages: async () => undefined as any,
				}
			},
		}
		const pluginModule = "https://myplugin5.com/index.js"
		const pluginModule2 = "https://myplugin6.com/index.js"
		const env = mockEnvWithPlugins({
			[pluginModule]: mockPlugin,
			[pluginModule2]: mockPlugin2,
		})

		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
					{
						options: {},
						module: pluginModule2,
					},
				],
			} as unknown as InlangConfig,
		})

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginFunctionLoadMessagesAlreadyDefinedException)
	})
})

describe("saveMessages", () => {
	it("should save messages to a local source", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["saveMessages"],
			},
			setup: () => {
				return {
					saveMessages: async () => undefined as any,
				}
			},
		}
		const pluginModule = "https://myplugin7.com/index.js"
		const env = mockEnvWithPlugins({ [pluginModule]: mockPlugin })

		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				],
			} as unknown as InlangConfig,
		})

		expect(resolved.errors).toHaveLength(0)
	})

	it("should collect an error if function is defined twice in multiple plugins", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin-save-messages",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["saveMessages"],
			},
			setup: () => {
				return {
					saveMessages: async () => undefined as any,
				}
			},
		}
		const mockPlugin2: PluginApi = {
			meta: {
				id: "plugin.plugin-save-messages2",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["saveMessages"],
			},
			setup: () => {
				return {
					saveMessages: async () => undefined as any,
				}
			},
		}
		const pluginModule = "https://myplugin8.com/index.js"
		const pluginModule2 = "https://myplugin9.com/index.js"
		const env = mockEnvWithPlugins({
			[pluginModule]: mockPlugin,
			[pluginModule2]: mockPlugin2,
		})

		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
					{
						options: {},
						module: pluginModule2,
					},
				],
			} as unknown as InlangConfig,
		})

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginFunctionSaveMessagesAlreadyDefinedException)
	})
})

describe("addLintRules", () => {
	it("should resolve a single lint rule", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["addLintRules"],
			},
			setup: () => {
				return {
					addLintRules: () => [
						{
							id: "test.test",
							displayName: { en: "" },
							defaultLevel: "error",
						},
					],
				}
			},
		}
		const pluginModule = "https://myplugin10.com/index.js"
		const env = mockEnvWithPlugins({ [pluginModule]: mockPlugin })

		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				],
			} as unknown as InlangConfig,
		})

		expect(resolved.data.lintRules).toHaveLength(1)
	})

	it("should resolve multiple lint rules", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["addLintRules"],
			},
			setup: () => {
				return {
					addLintRules: () => [
						{
							id: "test.test",
							displayName: { en: "" },
							defaultLevel: "error",
						},
						{
							id: "test2.test",
							displayName: { en: "" },
							defaultLevel: "error",
						},
					],
				}
			},
		}
		const pluginModule = "https://myplugin11.com/index.js"
		const env = mockEnvWithPlugins({ [pluginModule]: mockPlugin })

		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				],
			} as unknown as InlangConfig,
		})

		expect(resolved.data.lintRules).toHaveLength(2)
	})
})

describe("addAppSpecificApi", () => {
	it("it should resolve app specific configs", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["addAppSpecificApi"],
			},
			setup: () => {
				return {
					addAppSpecificApi: () => ({
						"my-app": {
							messageReferenceMatcher: () => undefined as any,
						},
					}),
				}
			},
		}
		const pluginModule = "https://myplugin12.com/index.js"
		const env = mockEnvWithPlugins({ [pluginModule]: mockPlugin })

		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				],
			} as unknown as InlangConfig,
		})

		expect(resolved.data.appSpecificApi).toHaveProperty("my-app")
	})

	it("it should resolve app specific configs", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["addAppSpecificApi"],
			},
			setup: () => {
				return {
					addAppSpecificApi: () => ({
						"my-app-1": {
							functionOfMyApp1: () => undefined as any,
						},
					}),
				}
			},
		}
		const mockPlugin2: PluginApi = {
			meta: {
				id: "plugin.plugin2",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["addAppSpecificApi"],
			},
			setup: () => {
				return {
					addAppSpecificApi: () => ({
						"my-app-2": {
							functionOfMyApp2: () => undefined as any,
						},
					}),
				}
			},
		}
		const pluginModule = "https://myplugin13.com/index.js"
		const pluginModule2 = "https://myplugin14.com/index.js"
		const env = mockEnvWithPlugins({
			[pluginModule]: mockPlugin,
			[pluginModule2]: mockPlugin2,
		})

		const resolved = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
					{
						options: {},
						module: pluginModule2,
					},
				],
			} as unknown as InlangConfig,
		})

		expect(resolved.data.appSpecificApi).toHaveProperty("my-app-1")
		expect(resolved.data.appSpecificApi).toHaveProperty("my-app-2")
	})
})

describe("error handling", () => {
	it("should handle PluginException instances thrown during plugin setup", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin-save-messages",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["saveMessages"],
			},
			setup: () => {
				throw new PluginException("Plugin error", { module: "https://myplugin15.com/index.js" })
			},
		}

		const pluginModule = "https://myplugin15.com/index.js"
		const env = mockEnvWithPlugins({
			[pluginModule]: mockPlugin,
		})

		const result = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				],
			} as unknown as InlangConfig,
		})

		expect(result.errors).toHaveLength(1)
		expect(result.errors[0]).toBeInstanceOf(PluginException)
	})

	it("should handle generic Error instances thrown during plugin setup", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin-save-messages",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["saveMessages"],
			},
			setup: () => {
				throw new Error("Generic error")
			},
		}

		const pluginModule = "https://myplugin15.com/index.js"
		const env = mockEnvWithPlugins({
			[pluginModule]: mockPlugin,
		})

		const result = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				],
			} as unknown as InlangConfig,
		})

		expect(result.errors).toHaveLength(1)
		expect(result.errors[0]).toBeInstanceOf(PluginException)
	})

	it("should handle unhandled and unknown errors during plugin setup", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.plugin-save-messages",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: ["saveMessages"],
			},
			setup: () => {
				throw "Unknown error"
			},
		}

		const pluginModule = "https://myplugin15.com/index.js"
		const env = mockEnvWithPlugins({
			[pluginModule]: mockPlugin,
		})

		const result = await resolvePlugins({
			env,
			config: {
				plugins: [
					{
						options: {},
						module: pluginModule,
					},
				],
			} as unknown as InlangConfig,
		})

		expect(result.errors).toHaveLength(1)
		expect(result.errors[0]).toBeInstanceOf(PluginException)
	})
})

// ---------------

function mockEnvWithPlugins(plugins: Record<string, PluginApi>): InlangEnvironment {
	return {
		$fs: () => undefined,
		$import: (moduleUrl: string) => {
			return {
				default: plugins[moduleUrl],
			}
		},
	} as unknown as InlangEnvironment
}
