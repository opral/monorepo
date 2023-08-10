import { InlangConfig } from "./schema.js"
import { Value } from "@sinclair/typebox/value"
import { describe, it, expect } from "vitest"

describe("config settings", () => {
	it("should pass with correct keys", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {},
		}
		const passCases = [
			// regular
			"namespace.helloWorld",
			// with numbers
			"namespace.pluginI18n",
			// only one word
			"namespace.world",
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

	it("should enforce camelCase", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {},
		}

		const failCases = [
			"namespace.hello-World",
			"namespace.HelloWorld",
			"namespace.hello_world",
			"namespace.hello world",
			"namespace.hello-worlD",
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
				// @ts-expect-error - Function is not a JSON
				"namespace.hello-world": {
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
				"namespace.helloWorld": {
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
})
