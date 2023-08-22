import { InlangConfig } from "@inlang/config"
import { Value } from "@sinclair/typebox/value"
import { describe, test, expect } from "vitest"
import { expectType } from "tsd"
import { Plugin } from "./api.js"

describe("Plugin", () => {
	test("meta.id should enforce namespace.plugin.* patterns", () => {
		expectType<`${string}.plugin.${string}`>("" as Plugin["meta"]["id"])

		const mockPlugin: Plugin = {
			meta: {
				id: "namespace.plugin.placeholder",
				displayName: { en: "" },
				description: { en: "" },
			},
		}

		const passCases = ["namespace.plugin.helloWorld", "namespace.plugin.i18n"]
		const failCases = [
			"namespace.hello_World",
			"namespace.plugin-HelloWorld",
			"namespace.lintRule.coolPlugin",
		]

		for (const pass of passCases) {
			mockPlugin.meta.id = pass as any

			expect(Value.Check(Plugin, mockPlugin)).toBe(true)
		}

		for (const fail of failCases) {
			mockPlugin.meta.id = fail as any
			expect(Value.Check(Plugin, mockPlugin)).toBe(false)
		}
	})

	test("meta.id should be a valid inlang.config.setting key", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {},
		}
		const cases = ["namespace.plugin.helloWorld", "namespace.plugin.i18n"]

		for (const _case of cases) {
			const config = { ...mockConfig, settings: { [_case]: {} } }
			expect(Value.Check(InlangConfig, config)).toBe(true)
			expect(Value.Check(Plugin["properties"]["meta"]["properties"]["id"], _case)).toBe(true)
		}
	})
})
