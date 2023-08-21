import type { LintRule } from "@inlang/lint"
import type { Plugin } from "@inlang/plugin"
import { describe, expect, it } from "vitest"
import type { InlangModule } from "./api.js"
import { ModuleError, ModuleHasNoExportsError, ModuleImportError } from "./errors.js"
import { resolveModules } from "./resolveModules.js"
import type { InlangConfig } from "@inlang/config"

describe("generally", () => {
	it("should return an error if a plugin cannot be imported", async () => {
		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
			settings: {},
		}

		const resolved = await resolveModules({
			config,
			nodeishFs: {} as any,
			_import: () => {
				throw new ModuleImportError("Could not import", {
					module: config.modules[0]!,
					cause: new Error("Could not import"),
				})
			},
		})

		expect(resolved.errors[0]).toBeInstanceOf(ModuleImportError)
	})
})

describe("resolveModules", () => {
	it("should resolve plugins and lint rules successfully", async () => {
		// Define mock data
		const mockPlugin: Plugin = {
			meta: {
				id: "namepsace.plugin.mock",
				description: { en: "Mock plugin description" },
				displayName: { en: "Mock Plugin" },
				keywords: [],
			},
			loadMessages: () => undefined as any,
			saveMessages: () => undefined as any,
			addAppSpecificApi: () => ({
				"inlang.app.ideExtension": {
					messageReferenceMatcher: () => undefined as any,
				},
			}),
		}

		const mockLintRule: LintRule = {
			type: "MessageLint",
			meta: {
				id: "namepsace.lintRule.mock",
				description: { en: "Mock lint rule description" },
				displayName: { en: "Mock Lint Rule" },
			},
			message: () => undefined,
		}

		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
			settings: {},
		}

		const _import = async () =>
			({
				default: {
					plugins: [mockPlugin],
					lintRules: [mockLintRule],
				},
			} satisfies InlangModule)

		// Call the function
		const resolved = await resolveModules({ config, _import, nodeishFs: {} as any })

		// Assert results
		expect(resolved.errors).toHaveLength(0)
		// Check for the meta data of the plugin
		expect(resolved.plugins.some((plugin) => plugin.meta.id === mockPlugin.meta.id)).toBeDefined()
		// Check for the app specific api
		expect(resolved.runtimePluginApi["appSpecificApi"]?.["inlang.app.ideExtension"]).toBeDefined()
		// Check for the lint rule
		expect(resolved.lintRules[0]?.meta.id).toBe(mockLintRule.meta.id)
	})

	it("should return an error if a plugin cannot be imported", async () => {
		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
			settings: {},
		}

		const _import = async () => {
			throw new ModuleImportError("Could not import", {
				module: config.modules[0]!,
				cause: new Error(),
			})
		}

		// Call the function
		const resolved = await resolveModules({ config, _import, nodeishFs: {} as any })

		// Assert results
		expect(resolved.errors[0]).toBeInstanceOf(ModuleImportError)
	})

	it("should return an error if a plugin does not export any plugins or lint rules", async () => {
		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
			settings: {},
		}

		const _import = async () => ({
			default: {},
		})

		// Call the function
		const resolved = await resolveModules({ config, _import, nodeishFs: {} as any })

		// Assert results
		expect(resolved.errors[0]).toBeInstanceOf(ModuleHasNoExportsError)
	})

	it("should handle other unhandled errors during plugin resolution", async () => {
		const errorMessage = "Unhandled error during plugin resolution"
		const config: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["de", "en"],
			modules: ["https://myplugin.com/index.js"],
			settings: {},
		}

		const _import = async () => {
			throw new Error(errorMessage)
		}

		// Call the function
		const resolved = await resolveModules({ config, _import, nodeishFs: {} as any })

		// Assert results
		expect(resolved.errors[0]).toBeInstanceOf(ModuleError)
	})
})
