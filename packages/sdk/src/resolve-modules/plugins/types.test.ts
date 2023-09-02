import { ProjectConfig } from "@inlang/project-config"
import { Value } from "@sinclair/typebox/value"
import { describe, test, expect } from "vitest"
import { expectType } from "tsd"
import { Plugin } from "@inlang/plugin"

describe("Plugin", () => {
	test("meta.id should enforce plugin.namespace.* patterns", () => {
		expectType<`plugin.${string}.${string}`>("" as Plugin["meta"]["id"])

		const mockPlugin: Plugin = {
			meta: {
				id: "plugin.namespace.placeholder",
				displayName: { en: "" },
				description: { en: "" },
			},
		}

		const passCases = ["plugin.namespace.helloWorld", "plugin.namespace.i18n"]
		const failCases = [
			"namespace.hello_World",
			"plugin.namespace-HelloWorld",
			"lintRule.namespace.coolPlugin",
		]

		for (const pass of passCases) {
			mockPlugin.meta.id = pass as any

			// @ts-ignore - type mismatch error. fix after refactor
			expect(Value.Check(Plugin, mockPlugin)).toBe(true)
		}

		for (const fail of failCases) {
			mockPlugin.meta.id = fail as any
			// @ts-ignore - type mismatch error. fix after refactor
			expect(Value.Check(Plugin, mockPlugin)).toBe(false)
		}
	})

	test("meta.id should be a valid inlang.config.setting key", () => {
		const mockConfig: ProjectConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {},
		}
		const cases = ["plugin.namespace.helloWorld", "plugin.namespace.i18n"]

		for (const _case of cases) {
			const config = { ...mockConfig, settings: { [_case]: {} } }
			// @ts-ignore - type mismatch error. fix after refactor
			expect(Value.Check(ProjectConfig, config)).toBe(true)
			// @ts-ignore - type mismatch error. fix after refactor
			expect(Value.Check(Plugin["properties"]["meta"]["properties"]["id"], _case)).toBe(true)
		}
	})
})
