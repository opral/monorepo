import {
	detectPlugins,
	getCurrentPluginUrls,
	lineParsing,
	migrateProjectSettings,
	parseDirtyValue,
} from "./migrate.js"
import { createNodeishMemoryFs } from "@lix-js/fs"
import path from "node:path"
import { ProjectSettings } from "@inlang/project-settings"
import { describe, expect, it } from "vitest"

describe("parseDirtyValue", () => {
	it("should parse a dirty JSON string", () => {
		// Arrange
		const jsonString = ' { "key": "value" },'

		// Act
		const parsedValue = parseDirtyValue(jsonString)

		// Assert
		expect(parsedValue).toEqual({ key: "value" })
	})
})

describe("getCurrentPluginUrls", () => {
	it("should return the URL of a plugin based on its name", () => {
		// Arrange
		const pluginName = "i18next"

		// Act
		const pluginUrl = getCurrentPluginUrls(pluginName)

		// Assert
		expect(pluginUrl).toBe("https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4/dist/index.js")
	})
})

describe("detectPlugins", () => {
	it("should detect plugins and lint rules in a URL", () => {
		// Arrange
		const url = "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4/dist/index.js"

		// Act
		const { moduleDetections, lintRuleDetections } = detectPlugins(url)

		// Assert
		expect(moduleDetections.size).toBe(1)
		expect(lintRuleDetections.size).toBe(0)
		expect(moduleDetections.has("i18next")).toBe(true)
	})
})

describe("migrateProjectSettings", () => {
	it("should migrate legacy project settings", async () => {
		// Arrange
		const nodeishFs = createNodeishMemoryFs()
		await nodeishFs.writeFile(
			"/inlang.config.js",
			`export async function defineConfig(env) {
			const { default: i18nextPlugin } = await env.$import(
			  "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@2/dist/index.js"
			);
		  
			const { default: standardLintRules } = await env.$import(
			  "https://cdn.jsdelivr.net/npm/@inlang/plugin-standard-lint-rules@3/dist/index.js"
			);
		  
			return {
			  referenceLanguage: "en",
			  plugins: [
				i18nextPlugin({
				  pathPattern: "./apps/web/public/static/locales/{language}/common.json",
				}),
				standardLintRules({
				  // deactivating identical pattern because of nested
				  // resources like "de-DE" and "de-AT" where "de-AT"
				  // contrains overwrites but the majority are identical patterns.
				  identicalPattern: "off",
				}),
			  ],
			};
		  }`,
		)
		// create en, de and fr folders at /apps/web/public/static/locales/ recursively
		await nodeishFs.mkdir("/apps/web/public/static/locales/en", { recursive: true })
		await nodeishFs.mkdir("/apps/web/public/static/locales/de", { recursive: true })
		await nodeishFs.mkdir("/apps/web/public/static/locales/fr", { recursive: true })
		// create common.json files in each folder
		await nodeishFs.writeFile("/apps/web/public/static/locales/en/common.json", "{}")
		await nodeishFs.writeFile("/apps/web/public/static/locales/de/common.json", "{}")
		await nodeishFs.writeFile("/apps/web/public/static/locales/fr/common.json", "{}")

		// Act
		const result = await migrateProjectSettings({
			nodeishFs,
			pathJoin: path.join,
		})

		// Assert
		expect(result.warnings).toEqual([])

		expect(result.config).toStrictEqual({
			sourceLanguageTag: "en",
			languageTags: ["en", "de", "fr"],
			modules: [
				"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4/dist/index.js",
				"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@1/dist/index.js",
				"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@1/dist/index.js",
				"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@1/dist/index.js",
				"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@1/dist/index.js",
			],
			"plugin.inlang.i18next": {
				pathPattern: "./apps/web/public/static/locales/{languageTag}/common.json",
			},
			"plugin.inlang.standardLintRules": { identicalPattern: "off" },
		})
	})
})

describe("lineParsing", () => {
	it("should parse legacy config lines", () => {
		// Arrange
		const legacyConfig = `export async function defineConfig(env) {
			const { default: i18nextPlugin } = await env.$import(
			  "https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@2/dist/index.js"
			);
		  
			const { default: standardLintRules } = await env.$import(
			  "https://cdn.jsdelivr.net/npm/@inlang/plugin-standard-lint-rules@3/dist/index.js"
			);
		  
			return {
			  referenceLanguage: "en",
			  plugins: [
				i18nextPlugin({
				  pathPattern: "./apps/web/public/static/locales/{language}/common.json",
				}),
				standardLintRules({
				  // deactivating identical pattern because of nested
				  // resources like "de-DE" and "de-AT" where "de-AT"
				  // contrains overwrites but the majority are identical patterns.
				  identicalPattern: "off",
				}),
			  ],
			};
		  }`

		const config = {} as ProjectSettings

		// Act
		const { parseErrors } = lineParsing(legacyConfig, config)

		// Assert
		expect(parseErrors).toStrictEqual([])
		// Add more assertions as needed for the extracted config.
	})

	// return a warning if project.inlang.json already exists
	it("should return a warning if project.inlang.json already exists", async () => {
		// Arrange
		const nodeishFs = createNodeishMemoryFs()
		await nodeishFs.writeFile("/project.inlang.json", "{}")

		// Act
		const result = await migrateProjectSettings({
			nodeishFs,
			pathJoin: path.join,
		})

		// Assert
		expect(result.warnings).toEqual(["Found project.inlang.json, skipping migration."])
	})
})
