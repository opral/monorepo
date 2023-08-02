import { describe, expect, it, vi } from "vitest"
import { resolvePlugins } from "./resolvePlugins.js"
import type { InlangConfig } from "@inlang/config"
import {
	PluginError,
	PluginFunctionLoadMessagesAlreadyDefinedError,
	PluginFunctionSaveMessagesAlreadyDefinedError,
	PluginInvalidIdError,
	PluginUsesReservedNamespaceError,
	PluginUsesInvalidApiError,
} from "./errors.js"
import type { InlangEnvironment } from "@inlang/environment"
import type { Plugin } from "./api.js"

describe("generally", () => {
	it("should return an error if a plugin uses an invalid id", async () => {
		const mockPlugin: Plugin = {
			meta: {
				// @ts-expect-error the id is invalid
				id: "no-namespace",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: [],
			},
			setup: () => undefined as any,
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
			addAppSpecificApi() {
				return undefined as any
			},
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		};

		const env = mockEnvWithPlugins({ [config.modules[0]!]: mockPlugin })
		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
			config,
			env,
		});	

		expect(resolved.errors[0]).toBeInstanceOf(PluginInvalidIdError)
	})

	it("should return an error if a plugin uses APIs that are not available", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.my-plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			// @ts-expect-error the API is not available
			nonExistentApi: () => undefined,
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		};

		const env = mockEnvWithPlugins({ [config.modules[0]!]: mockPlugin })
		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
			config,
			env,
		});

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesInvalidApiError)
	})

	it("should not initialize a plugin that uses the 'inlang' namespace except for inlang whitelisted plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "inlang.not-whitelisted-plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => undefined as any,
			loadMessages: () => undefined as any,
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		};

		const env = mockEnvWithPlugins({ [config.modules[0]!]: mockPlugin })
		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
			config,
			env,
		});

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesReservedNamespaceError)
	})
})

describe("loadMessages", () => {
	it("should load messages from a local source", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => undefined as any,
			loadMessages: async () => [{ id: "test", expressions: [], selectors: [], body: { en: [] } }],
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		};

		const env = mockEnvWithPlugins({ [config.modules[0]!]: mockPlugin })
		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
			config,
			env,
		});

		expect(await resolved.data.loadMessages!({ languageTags: ["en"] })).toEqual([{ id: "test", expressions: [], selectors: [], body: { en: [] } }])
	})

	it("should collect an error if function is defined twice in multiple plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin-load-messages-first",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => undefined as any,
			loadMessages: async () => undefined as any,
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.plugin-load-messages-second",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => undefined as any,
			loadMessages: async () => undefined as any,
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin5.com/index.js", "https://myplugin6.com/index.js"],
		};

		const env = mockEnvWithPlugins({
			[config.modules[0]!]: mockPlugin,
			[config.modules[1]!]: mockPlugin2,
		})

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin, mockPlugin2],
			pluginSettings: {},
			config,
			env,
		});

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginFunctionLoadMessagesAlreadyDefinedError)
	})
})

describe("saveMessages", () => {
	it("should save messages to a local source", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => undefined as any,
			saveMessages: async () => undefined as any,
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		};

		const env = mockEnvWithPlugins({ [config.modules[0]!]: mockPlugin })
		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
			config,
			env,
		});

		expect(resolved.errors).toHaveLength(0)
	})

	it("should collect an error if function is defined twice in multiple plugins", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin-save-messages",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => undefined as any,
			saveMessages: async () => undefined as any,
		}
		const mockPlugin2: Plugin = {
			meta: {
				id: "plugin.plugin-save-messages2",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => undefined as any,
			saveMessages: async () => undefined as any,
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin5.com/index.js", "https://myplugin6.com/index.js"],
		};

		const env = mockEnvWithPlugins({
			[config.modules[0]!]: mockPlugin,
			[config.modules[1]!]: mockPlugin2,
		})

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin, mockPlugin2],
			pluginSettings: {},
			config,
			env,
		});

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginFunctionSaveMessagesAlreadyDefinedError)
	})
})

describe("addAppSpecificApi", () => {
	it("it should resolve app specific api", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => undefined as any,
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
		};

		const env = mockEnvWithPlugins({ [config.modules[0]!]: mockPlugin })
		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
			config,
			env,
		});

		expect(resolved.data.appSpecificApi).toHaveProperty("my-app")
	})

	it("it should resolve multiple app specific apis", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => undefined as any,
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
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => undefined as any,
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
		};

		const env = mockEnvWithPlugins({
			[config.modules[0]!]: mockPlugin,
			[config.modules[1]!]: mockPlugin2,
		})

		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin, mockPlugin2],
			pluginSettings: {},
			config,
			env,
		});

		expect(resolved.data.appSpecificApi).toHaveProperty("my-app-1")
		expect(resolved.data.appSpecificApi).toHaveProperty("my-app-2")
		expect(resolved.data.appSpecificApi).toHaveProperty("my-app-3")
	})
})

describe("error handling", () => {
	it("should handle PluginError instances thrown during plugin setup", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin-save-messages",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => {
				throw new PluginError("Plugin error", { plugin: "plugin.plugin-save-messages" })
			},
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		};

		const env = mockEnvWithPlugins({ [config.modules[0]!]: mockPlugin })
		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
			config,
			env,
		});

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginError)
	})

	it("should handle generic Error instances thrown during plugin setup", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin-save-messages",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => {
				throw new Error("Generic error")
			},
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		};

		const env = mockEnvWithPlugins({ [config.modules[0]!]: mockPlugin })
		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
			config,
			env,
		});

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginError)
	})

	it("should handle unhandled and unknown errors during plugin setup", async () => {
		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.plugin-save-messages",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
			},
			setup: () => {
				throw "Unknown error"
			},
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
		};

		const env = mockEnvWithPlugins({ [config.modules[0]!]: mockPlugin })
		const resolved = await resolvePlugins({
			module: config.modules[0]!,
			plugins: [mockPlugin],
			pluginSettings: {},
			config,
			env,
		});

		expect(resolved.errors).toHaveLength(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginError)
	})
})

// ---------------

function mockEnvWithPlugins(plugins: Record<string, Plugin>): InlangEnvironment {
	return {
		$fs: () => undefined,
		$import: (moduleUrl: string) => {
			return {
				default: plugins[moduleUrl],
			}
		},
	} as unknown as InlangEnvironment
}
