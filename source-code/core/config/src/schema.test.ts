import { InlangConfig } from "./schema.js"
import { Value } from "@sinclair/typebox/value"
import { describe, it, expect } from "vitest"

describe("config.settings", () => {
	it("should enforce an object as value", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				// @ts-expect-error - Value is not an object
				"namespace.plugin.helloWorld": "value",
				// @ts-expect-error - Value is not an object
				"x.plugin.x": false,
				"x.plugin.y": {},
			},
		}
		expect(Value.Check(InlangConfig, mockConfig)).toBe(false)
	})

	it("should be possible to have one nested object layer", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				"x.plugin.y": {
					hello: {
						world: 4,
					},
				},
			},
		}
		expect(Value.Check(InlangConfig, mockConfig)).toBe(true)
	})

	it("should pass lintRule|plugin|app keys", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {},
		}
		const passCases = [
			"namespace.lintRule.helloWorld",
			"namespace.plugin.i18n",
			"namespace.app.ideExtension",
		]

		for (const passCase of passCases) {
			const config = { ...mockConfig, settings: { [passCase]: {} } }
			expect(Value.Check(InlangConfig, config)).toBe(true)
		}
	})

	it("should enforce namespaces", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				// @ts-expect-error - Namespace is missing
				withoutNamespace: {},
			},
		}
		expect(Value.Check(InlangConfig, mockConfig)).toBe(false)
	})

	it("should fail on unknown types", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				// @ts-expect-error - unknown type
				"namespace.unknownType.name": {},
			},
		}
		expect(Value.Check(InlangConfig, mockConfig)).toBe(false)
	})

	it("should enforce camelCase", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {},
		}

		const failCases = [
			"namespace.plugin.hello-World",
			"namespace.plugin.HelloWorld",
			"namespace.plugin.hello_world",
			"namespace.plugin.hello world",
			"namespace.plugin.hello-worlD",
		]

		for (const failCase of failCases) {
			const config = { ...mockConfig, settings: { [failCase]: {} } }
			expect(Value.Check(InlangConfig, config)).toBe(false)
		}
	})

	it("should not be possible to use non-JSON values", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				"namespace.app.name": {
					// @ts-expect-error - Function is not a JSON
					myFunction: () => {
						return "Hello World"
					},
					hello: "World",
				},
			},
		}
		expect(Value.Check(InlangConfig, mockConfig)).toBe(false)
	})

	it("should be possible to use JSON values", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				"namespace.plugin.helloWorld": {
					hello: "World",
					bool: true,
					// eslint-disable-next-line unicorn/no-null
					null: null,
					number: 123,
					array: [1, 2, 3],
				},
			},
		}
		expect(Value.Check(InlangConfig, mockConfig)).toBe(true)
	})

	// (reserving system namespace for internal use only)
	it("should not be possible to define unknown system settings", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {
				// @ts-expect-error - unknown system key
				"system.unknown.name": {},
			},
		}
		expect(Value.Check(InlangConfig, mockConfig)).toBe(false)
	})
})
