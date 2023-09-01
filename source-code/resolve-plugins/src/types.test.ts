import { ProjectConfig } from "@inlang/project-config"
import { Value } from "@sinclair/typebox/value"
import { describe, test, expect } from "vitest"
import { expectType } from "tsd"
import { Plugin } from "@inlang/plugin"

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
			packages: [],
			settings: {},
		}
		const cases = ["namespace.plugin.helloWorld", "namespace.plugin.i18n"]

		for (const _case of cases) {
			const config = { ...mockConfig, settings: { [_case]: {} } }
			// @ts-ignore - type mismatch error. fix after refactor
			expect(Value.Check(ProjectConfig, config)).toBe(true)
			// @ts-ignore - type mismatch error. fix after refactor
			expect(Value.Check(Plugin["properties"]["meta"]["properties"]["id"], _case)).toBe(true)
		}
	})
})
