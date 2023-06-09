import { it, expect } from "vitest"
import { standardLintRules } from "./plugin.js"
import type { InlangEnvironment } from "@inlang/core/environment"
import * as rules from "./rules/index.js"
import type { LintRule } from "@inlang/core/lint"

const totalNumberOfRules = Object.keys(rules).length

it("should add all lint rules with a default level", async () => {
	const plugin = standardLintRules({})({} as InlangEnvironment)
	const config = await plugin.config()
	expect(config.lint?.rules).toHaveLength(totalNumberOfRules)
})

it("should be able to turn off lint rules", async () => {
	const plugin = standardLintRules({
		missingMessage: "off",
	})({} as InlangEnvironment)
	const config = await plugin.config()
	expect(config.lint?.rules).toHaveLength(totalNumberOfRules - 1)
})

it("should be able to overwrite the default level of lint rules", async () => {
	const plugin = standardLintRules({
		missingMessage: "warn",
	})({} as InlangEnvironment)
	const config = await plugin.config()
	expect(config.lint?.rules).toHaveLength(totalNumberOfRules)
	const rule = config.lint!.rules.find(
		(rule) => (rule as LintRule).id === "inlang.missingMessage",
	) as LintRule
	expect(rule.level).toBe("warn")
})
