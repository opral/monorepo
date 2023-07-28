import { describe, expect, it, vi } from "vitest"
import { resolvePlugins } from "./resolvePlugins.js"
import type { InlangConfig } from "@inlang/config"
import {
	PluginFunctionLoadMessagesAlreadyDefinedError,
	PluginFunctionSaveMessagesAlreadyDefinedError,
	PluginImportError,
	PluginIncorrectlyDefinedUsedApisError,
	PluginInvalidIdError,
	PluginUsesReservedNamespaceError,
	PluginUsesUnavailableApiError,
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
		expect(resolved.errors[0]).toBeInstanceOf(PluginImportError)
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
		expect(resolved.errors[0]).toBeInstanceOf(PluginInvalidIdError)
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
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesUnavailableApiError)
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
		expect(resolved.errors[0]).toBeInstanceOf(PluginIncorrectlyDefinedUsedApisError)
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
		expect(resolved.errors[0]).toBeInstanceOf(PluginIncorrectlyDefinedUsedApisError)
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
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesReservedNamespaceError)
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
		expect(resolved.errors[0]).toBeInstanceOf(PluginFunctionLoadMessagesAlreadyDefinedError)
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
		expect(resolved.errors[0]).toBeInstanceOf(PluginFunctionSaveMessagesAlreadyDefinedError)
	})
})

// describe("addLintRules", () => {
// 	it("should resolve a single lint rule", async () => {
// 		const resolved = await resolvePlugins(mockArgs)
// 	})

// 	it("should resolve multiple lint rules", async () => {
// 		const resolved = await resolvePlugins(mockArgs)
// 	})
// })

// describe("addAppSpecificApi", () => {
// 	it("it should resolve app specific configs", async () => {
// 		const resolved = await resolvePlugins(mockArgs)
// 	})

// 	it("it should resolve app specific configs", async () => {
// 		const resolved = await resolvePlugins(mockArgs)
// 	})
// })

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
