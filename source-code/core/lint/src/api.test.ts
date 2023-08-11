import { InlangConfig } from "@inlang/config"
import { Value } from "@sinclair/typebox/value"
import { describe, test, expect } from "vitest"
import { LintRuleBase } from "./api.js"
import { expectType } from "tsd"

describe("LintRule", () => {
	test("meta.id should enforce namespace.lintRule* patterns", () => {
		expectType<`${string}.lintRule${string}`>("" as LintRuleBase["meta"]["id"])

		const mockLintRule: LintRuleBase = {
			type: "MessageLint",
			meta: {
				id: "namespace.lintRulePlaceholder",
				displayName: { en: "" },
				description: { en: "" },
			},
			defaultLevel: "error",
		}

		const passCases = ["namespace.lintRuleHelloWorld", "namespace.lintRuleI18n"]
		const failCases = ["namespace.hello_World", "namespace.lint-rule-HelloWorld"]

		for (const pass of passCases) {
			mockLintRule.meta.id = pass as any

			expect(Value.Check(LintRuleBase, mockLintRule)).toBe(true)
		}

		for (const fail of failCases) {
			mockLintRule.meta.id = fail as any
			expect(Value.Check(LintRuleBase, mockLintRule)).toBe(false)
		}
	})

	test("meta.id should be a valid inlang.config.setting key", () => {
		const mockConfig: InlangConfig = {
			sourceLanguageTag: "en",
			languageTags: ["en", "de"],
			modules: [],
			settings: {},
		}
		const cases = ["namespace.lintRuleHelloWorld", "namespace.lintRuleI18n"]

		for (const _case of cases) {
			const config = { ...mockConfig, settings: { [_case]: {} } }
			expect(Value.Check(InlangConfig, config)).toBe(true)
			expect(Value.Check(LintRuleBase["properties"]["meta"]["properties"]["id"], _case)).toBe(true)
		}
	})
})
