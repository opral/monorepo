import { describe, it, expect } from "vitest"
import { createInlang } from "./createInlang.js"
// eslint-disable-next-line no-restricted-imports
import fs from "node:fs/promises"
import type { InlangConfig } from "@inlang/config"
import type { Plugin } from "@inlang/plugin"
import type { LintRule } from "@inlang/lint"
import type { InlangModule } from "@inlang/module"

const config: InlangConfig = {
	sourceLanguageTag: "en",
	languageTags: ["en"],
	modules: ["./dist/index.js"],
	settings: {
		plugins: {
			"inlang.plugin-i18next": {
				options: {
					pathPattern: "./examples/example01/{languageTag}.json",
					variableReferencePattern: ["{", "}"],
				},
			},
		},
		lintRules: {
			"inlang.missingMessage": {
				level: "error",
			},
		},
	},
}

const mockPlugin: Plugin = {
	meta: {
		id: "mock.plugin",
		description: { en: "Mock plugin description" },
		displayName: { en: "Mock Plugin" },
		keywords: [],
	},
	loadMessages: () => undefined as any,
	saveMessages: () => undefined as any,
	addAppSpecificApi: () => ({
		"inlang.ide-extension": {
			messageReferenceMatcher: () => undefined as any,
		},
	}),
}

const mockLintRule: LintRule = {
	meta: {
		id: "mock.lint-rule",
		description: { en: "Mock lint rule description" },
		displayName: { en: "Mock Lint Rule" },
	},
	defaultLevel: "error",
}

const env = {
	$fs: fs,
	$import: async () =>
		({
			default: {
				plugins: [mockPlugin],
				lintRules: [mockLintRule],
			},
		} satisfies InlangModule),
}

describe("test", () => {
	it("test", async () => {
		await env.$fs.writeFile("./inlang.config.json", JSON.stringify(config))
		const inlang = await createInlang({
			configPath: "./inlang.config.json",
		})
		const reactiveConfig = instance.config.get()
		instance.config.set({ ...reactiveConfig, languageTags: ["en", "de"] })
		expect(reactiveConfig.languageTags.length).toBe(1)
	})
})
