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
				id: "namespace.lintRule.placeholder",
				displayName: { en: "" },
				description: { en: "" },
			},
			defaultLevel: "error",
		}

		const passCases = ["namespace.lintRule.helloWorld", "namespace.lintRule.i18n"]
		const failCases = ["namespace.helloWorld.name", "namespace.lint-rule-HelloWorld"]

		for (const pass of passCases) {
			mockLintRule.meta.id = pass as any

			expect(Value.Check(LintRuleBase, mockLintRule)).toBe(true)
		}

		for (const fail of failCases) {
			mockLintRule.meta.id = fail as any
			expect(Value.Check(LintRuleBase, mockLintRule)).toBe(false)
		}
	})
})
