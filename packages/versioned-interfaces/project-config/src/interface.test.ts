import { ProjectConfig } from "./interface.js"
import { Value } from "@sinclair/typebox/value"
import { describe, it, expect } from "vitest"

describe("config.languageTags", () => {
	it("should enforce unique language tags", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "en"],
			modules: [],
			settings: {},
		}
		expect(Value.Check(ProjectConfig, mockConfig)).toBe(false)
	})
})

describe("config.modules", () => {
	it("should be possible to use a jsdelivr uri", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en"],
			modules: ["https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js"],
			settings: {},
		}
		const errors = [...Value.Errors(ProjectConfig, mockConfig)]
		if (errors.length > 0) {
			console.error(errors)
		}
		expect(Value.Check(ProjectConfig, mockConfig)).toBe(true)
	})
	it("should be possible to reference a local module", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en"],
			modules: ["./my-module.js"],
			settings: {},
		}
		expect(Value.Check(ProjectConfig, mockConfig)).toBe(true)
	})

	it("must enforce unique modules", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [
				"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
				"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
			],
			settings: {},
		}
		expect(Value.Check(ProjectConfig, mockConfig)).toBe(false)
	})

	it("must enforce a .js ending for modules", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: ["https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index"],
			settings: {},
		}
		expect(Value.Check(ProjectConfig, mockConfig)).toBe(false)
	})

	it("should enforce backwards compatible versioning (not SemVer)", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: ["https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4/dist/index"],
			settings: {},
		}

		const passCases = [
			"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@3/dist/index.js",
			"https://cdn.jsdelivr.net/@3/dist/index.js",
		]

		const failCases = [
			"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@5.1/dist/index.js",
			"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@5.1.2/dist/index.js",
		]

		for (const passCase of passCases) {
			const config = { ...mockConfig, modules: [passCase] }
			expect(Value.Check(ProjectConfig, config)).toBe(true)
		}

		for (const failCase of failCases) {
			const config = { ...mockConfig, modules: [failCase] }
			expect(Value.Check(ProjectConfig, config)).toBe(false)
		}
	})
})

describe("config.settings", () => {
	it("should be possible to have one nested object layer", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				"plugin.x.y": {
					hello: {
						world: 4,
					},
				},
			},
		}
		expect(Value.Check(ProjectConfig, mockConfig)).toBe(true)
	})

	it("should pass messageLintRule|plugin|app keys", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {},
		}
		const passCases = [
			"app.namespace.ideExtension",
			"plugin.namespace.i18n",
			"messageLintRule.namespace.helloWorld",
		]

		for (const passCase of passCases) {
			const config = { ...mockConfig, settings: { [passCase]: {} } }
			expect(Value.Check(ProjectConfig, config)).toBe(true)
		}
	})

	it("should enforce namespaces", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				// @ts-expect-error - Namespace is missing
				withoutNamespace: {},
			},
		}
		expect(Value.Check(ProjectConfig, mockConfig)).toBe(false)
	})

	it("should fail on unknown types", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				// @ts-expect-error - unknown type
				"namespace.unknownType.name": {},
			},
		}
		expect(Value.Check(ProjectConfig, mockConfig)).toBe(false)
	})

	it("should enforce camelCase", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {},
		}

		const failCases = [
			"plugin.namepsace.hello-World",
			"plugin.namepsace.HelloWorld",
			"plugin.namepsace.hello_world",
			"plugin.namepsace.hello world",
			"plugin.namepsace.hello-worlD",
		]

		for (const failCase of failCases) {
			const config = { ...mockConfig, settings: { [failCase]: {} } }
			expect(Value.Check(ProjectConfig, config)).toBe(false)
		}
	})

	it("should not be possible to use non-JSON values", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				"app.namespace.id": {
					// @ts-expect-error - Function is not a JSON
					myFunction: () => {
						return "Hello World"
					},
					hello: "World",
				},
			},
		}
		expect(Value.Check(ProjectConfig, mockConfig)).toBe(false)
	})

	it("should be possible to use JSON values", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				"plugin.namespace.helloWorld": {
					hello: "World",
					bool: true,
					// eslint-disable-next-line unicorn/no-null
					null: null,
					number: 123,
					array: [1, 2, 3],
				},
			},
		}
		expect(Value.Check(ProjectConfig, mockConfig)).toBe(true)
	})

	// (reserving project namespace for internal use only)
	it("should not be possible to define unknown project settings", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				// @ts-expect-error - unknown project key
				"project.unknown.name": {},
			},
		}
		expect(Value.Check(ProjectConfig, mockConfig)).toBe(false)
	})

	it("should be possible to define known project settings", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				"project.messageLintRuleLevels": {
					"messageLintRule.namespace.helloWorld": "error",
				},
			},
		}
		expect(Value.Check(ProjectConfig, mockConfig)).toBe(true)
	})
})

it("should pass with valid real world configs", () => {
	const configs: ProjectConfig[] = [
		{
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [
				"https://cdn.jsdelivr.net/npm/@inlang/plugin-json@4/dist/index.js",
				"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@1/dist/index.js",
				"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@1/dist/index.js",
				"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@1/dist/index.js",
				"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@1/dist/index.js",
			],
			settings: {
				"plugin.inlang.json": {
					pathPattern: "./resources/{language}.json",
					variableReferencePattern: ["{", "}"],
				},
			},
		},
	]
	for (const config of configs) {
		expect(Value.Check(ProjectConfig, config)).toBe(true)
	}
})