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
import { createMemoryFs } from "@inlang-git/fs"
import type { InlangEnvironment } from "@inlang/environment"
import type { PluginApi } from "./api.js"

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

const mockArgs = { config: mockConfig, env: {} as any }

describe("generally", () => {
	// namespace is required, only kebap-case allowed
	it("should return errors if plugins use invalid ids", async () => {
		const env = mockEnvWithPlugin({
			meta: {
				// @ts-expect-error the id is invalid
				id: "no-namespace",
				description: { en: "" },
				displayName: { en: "" },
				keywords: [],
				usedApis: [],
			},
			setup: () => undefined as any,
		})
		const resolved = await resolvePlugins({ env, config: mockConfig })
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
		const resolved = await resolvePlugins(mockArgs)
		expect(resolved.errors.length).length(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginUsesUnavailableApiError)
	})

	it("should return an error if a plugin uses APIs that are not defined in meta.usedApis", async () => {
		const resolved = await resolvePlugins(mockArgs)
		expect(resolved.errors.length).length(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginIncorrectlyDefinedUsedApisError)
	})

	it("should return an error if a plugin DOES NOT use APIs that are defined in meta.usedApis", async () => {
		const resolved = await resolvePlugins(mockArgs)
		expect(resolved.errors.length).length(1)
		expect(resolved.errors[0]).toBeInstanceOf(PluginIncorrectlyDefinedUsedApisError)
	})

	it("should not initialize a plugin that uses the 'inlang' namespace except for inlang whitelisted plugins", async () => {
		const resolved = await resolvePlugins(mockArgs)
		expect(resolved.errors.length).length(1)
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

function mockEnvWithPlugin(plugin: PluginApi): InlangEnvironment {
	return {
		$fs: () => undefined,
		$import: () => {
			return { default: plugin }
		},
	} as unknown as InlangEnvironment
}
