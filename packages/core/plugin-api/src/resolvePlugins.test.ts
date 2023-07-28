import { describe, expect, it, vi } from "vitest"
import { resolvePlugins } from "./resolvePlugins.js"
import type { InlangConfig } from "@inlang/config"
import {
	PluginImportError,
	PluginIncorrectlyDefinedUsedApisError,
	PluginInvalidIdError,
	PluginUsesReservedNamespaceError,
	PluginUsesUnavailableApiError,
} from "./errors.js"
import type { InlangEnvironment } from "@inlang/environment"
import type { PluginApi } from "./api.js"
import { log } from "console"

const mockConfig: InlangConfig = {
	sourceLanguageTag: "en",
	languageTags: ["en", "de"],
	plugins: [
		{
			options: {
				tagMatchers: "{{}}",
			},
			module: "https://myplugin.com/index.js",
		},
	],
	lint: {
		rules: {},
	},
}

const mockConfigWithPlugins = {
	...mockConfig,
	plugins: [
		{
			options: {
				tagMatchers: "{{}}",
			},
			module: "https://myplugin1.com/index.js",
		},
		{
			options: {
				tagMatchers: "{{}}",
			},
			module: "https://myplugin2.com/index.js",
		},
	],
}

const mockArgs = { config: mockConfig, env: {} as any }

describe("generally", () => {
	// namespace is required, only kebap-case allowed
	it("should return errors if plugins use invalid ids", async () => {
		const env = mockEnvWithPlugins([
			{
				meta: {
					// @ts-expect-error the id is invalid
					id: "no-namespace",
					description: { en: "" },
					displayName: { en: "" },
					keywords: [],
					usedApis: [],
				},
				setup: () => undefined as any,
			},
		])
		const resolved = await resolvePlugins({ env, config: mockConfig })
		console.log(resolved.errors)
		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginInvalidIdError)
	})

	it("should return an error if a plugin cannot be imported", async () => {
		const resolved = await resolvePlugins({
			env: {
				$fs: {} as any,
				$import: () => {
					throw Error("Could not import")
				},
			},
			config: mockConfig,
		})

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginImportError)
	})

	it("should return an error if a plugin uses APIs that are not available", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.myplugin1",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				// @ts-expect-error
				usedApis: ["nonExistentApi"], // Using an API that doesn't exist
			},
			setup: () => ({ addAppSpecificApi: () => undefined as any, addLintRules: () => [] }),
		}

		const env = mockEnvWithPlugins([mockPlugin])
		const resolved = await resolvePlugins({ env, config: mockConfig })

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesUnavailableApiError)
	})

	it("should return an error if a plugin uses APIs that are not defined in meta.usedApis", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.myplugin1",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				// @ts-expect-error
				usedApis: ["nonExistentApi"], // API not defined in meta.usedApis
			},
			setup: () => ({ addAppSpecificApi: () => undefined as any, addLintRules: () => [] }),
		}

		const mockConfigWithUsedApis = {
			...mockConfig,
			usedApis: ["someOtherApi"], // Define some other API in meta.usedApis
		}

		const env = mockEnvWithPlugins([mockPlugin])
		const resolved = await resolvePlugins({ env, config: mockConfigWithUsedApis })

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginIncorrectlyDefinedUsedApisError)
	})

	it("should return an error if a plugin DOES NOT use APIs that are defined in meta.usedApis", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "plugin.myplugin1",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: [], // Empty usedApis array, not using any APIs
			},
			setup: () => ({ addAppSpecificApi: () => undefined as any, addLintRules: () => [] }),
		}

		const mockConfigWithUsedApis = {
			...mockConfig,
			usedApis: ["someApi"], // Define some API in meta.usedApis
		}

		const env = mockEnvWithPlugins([mockPlugin])
		const resolved = await resolvePlugins({ env, config: mockConfigWithUsedApis })

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginIncorrectlyDefinedUsedApisError)
	})

	it("should not initialize a plugin that uses the 'inlang' namespace except for inlang whitelisted plugins", async () => {
		const mockPlugin: PluginApi = {
			meta: {
				id: "inlang.myplugin", // Using 'inlang' namespace, but not whitelisted
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: [],
			},
			setup: () => ({ addAppSpecificApi: () => undefined as any, addLintRules: () => [] }),
		}

		const env = mockEnvWithPlugins([mockPlugin])
		const resolved = await resolvePlugins({ env, config: mockConfig })

		expect(resolved.errors.length).toBe(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesReservedNamespaceError)
	})
})

describe("loadMessages", () => {
	it("should load messages from a local source", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})
	it("should collect an error if function is defined twice", async () => {})
})

describe("saveMessages", () => {
	it("should save messages to a local source", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})
	it("should collect an error if function is defined twice", async () => {})
})

describe("addLintRules", () => {
	it("should resolve a single lint rule", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})

	it("should resolve multiple lint rules", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})
})

describe("addAppSpecificApi", () => {
	it("it should resolve app specific configs", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})

	it("it should resolve app specific configs", async () => {
		const resolved = await resolvePlugins(mockArgs)
	})
})

// ---------------

function mockEnvWithPlugins(plugins: PluginApi[]): InlangEnvironment {
	const pluginModules = plugins.reduce((acc, plugin) => {
		// @ts-expect-error
		acc[plugin.meta.id] = { default: plugin }
		return acc
	}, {})

	return {
		$fs: () => undefined,
		$import: (moduleUrl: string) => {
			// @ts-expect-error
			return pluginModules[moduleUrl]
		},
	} as unknown as InlangEnvironment
}
