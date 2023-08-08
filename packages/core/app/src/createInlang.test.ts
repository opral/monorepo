import { describe, it, expect } from "vitest"
import { createInlang } from "./createInlang.js"
// eslint-disable-next-line no-restricted-imports
import fs from "node:fs/promises"
import type { InlangConfig } from "@inlang/config"
import type { Message, Plugin } from "@inlang/plugin"
import type { LintRule } from "@inlang/lint"
import type { InlangModule } from "@inlang/module"
import { createRoot, createEffect } from "./solid.js"

describe("initialization", () => {
	describe("config", () => {
		it.todo("should throw if config file is not found", async () => {
			try {
				await fs.readFile("./inlang.config.json", "utf-8")
			}
			catch (e) {
				expect((e as Error).message).toBe("ENOENT: no such file or directory, open './inlang.config.json'")
			}

			try	{
				await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				})
				throw new Error("Should not reach this")
			}
			catch (e) {
				expect((e as Error).message).toBe("Config file not found")
			}
		})
		
		it.todo("should throw if config file is not a valid JSON", async () => {
			await fs.writeFile("./inlang.config.json", "invalid json")
			try	{
				await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				})
				throw new Error("Should not reach this")
			}
			catch (e) {
				expect((e as Error).message).toBe("Config file is not valid JSON")
			}
		})

		it.todo("should throw if config file is does not match schema", async () => {
			await fs.writeFile("./inlang.config.json", JSON.stringify({}))
			try	{
				await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				})
				throw new Error("Should not reach this")
			}
			catch (e) {
				expect((e as Error).message).toBe("Config file does not match schema")
			}
		})

		it("should return the parsed config", async () => {
			await fs.writeFile("./inlang.config.json", JSON.stringify(config))
			const inlang = await createInlang({
				configPath: "./inlang.config.json",
				nodeishFs: fs,
				_import: $import,
			})
			expect(inlang.config.get()).toEqual(config)
		})
	})

	describe("modules", () => {
		it.todo("should throw if plugins contain errors ???")
		it.todo("should throw if lintRules contain errors ???")
		it.todo("should return meta data")
		it.todo("should return plugins")
		it.todo("should return lint rules")
	})

	describe("flow", () => {
		it.todo("should not call functions multiple times")
		it.todo("should load modules after config")
		it.todo("should not load messages")
		it.todo("should not call lint")
	})

	describe("instance object", () => {
		it.todo("should contain all fields")
	})
})

describe("reactivity", () => {
	describe("config", () => {
		it("should react to changes to config", async () => { 
			createRoot( async () => {
				await fs.writeFile("./inlang.config.json", JSON.stringify(config))
				const inlang = await createInlang({
					configPath: "./inlang.config.json",
					nodeishFs: fs,
					_import: $import,
				})
				const reactiveConfig = inlang.config.get
				let counter = 0
	
				createEffect(() => {
					// 2 times because effect creation + set
					reactiveConfig()
					counter += 1
				})		
	
				inlang.config.set({ ...reactiveConfig(), languageTags: ["en", "de"] })
				expect(counter).toBe(2)
			})
		})
	})

	describe("modules", () => {
		it.todo("should react to changes to config")
	})

	describe("messages", () => {
		it.todo("should react to changes to config")
		it.todo("should react to changes to modules")
	})

	describe("lint", () => {
		it.todo("should react to changes to config")
		it.todo("should react to changes to modules")
		it.todo("should react to changes to mesages")
	})

	describe("query", () => {
		it.todo("should react to changes to mesages")
	})
})

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
		id: "inlang.plugin-i18next",
		description: { en: "Mock plugin description" },
		displayName: { en: "Mock Plugin" },
		keywords: [],
	},
	loadMessages: () => exampleMessages,
	saveMessages: () => undefined as any,
	addAppSpecificApi: () => ({
		"inlang.ide-extension": {
			messageReferenceMatcher: () => undefined as any,
		},
	}),
}

const exampleMessages: Message[] = [
	{
		id: "common:a..b",
		selectors: [],
		body: {
			en: [
				{
					match: {},
					pattern: [
						{
							type: "Text",
							value: "common a b",
						},
					],
				},
			],
		},
	},
	{
		id: "common:c.",
		selectors: [],
		body: {
			en: [
				{
					match: {},
					pattern: [
						{
							type: "Text",
							value: "common c ",
						},
					],
				},
			],
		},
	},
]

const mockLintRule: LintRule = {
	meta: {
		id: "inlang.missingMessage",
		description: { en: "Mock lint rule description" },
		displayName: { en: "Mock Lint Rule" },
	},
	defaultLevel: "error",
}

const $import = async () =>
({
	default: {
		plugins: [mockPlugin],
		lintRules: [mockLintRule],
	},
} satisfies InlangModule)
