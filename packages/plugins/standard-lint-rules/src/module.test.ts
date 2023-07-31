import { it, expect } from "vitest"
import { standardLintRulesModule } from "./module.js"
import type { InlangEnvironment } from "@inlang/core/environment"
import type { LintRule } from "@inlang/core/lint"

const totalNumberOfRules = 3

it("should add all lint rules with a default level", async () => {
	const plugin = standardLintRulesModule({})({} as InlangEnvironment)
	const config = await plugin.config()
	expect(config.lint?.rules).toHaveLength(totalNumberOfRules)
})

it("should be able to turn off lint rules", async () => {
	const plugin = standardLintRulesModule({
		missingMessage: "off",
	})({} as InlangEnvironment)
	const config = await plugin.config()
	expect(config.lint?.rules).toHaveLength(totalNumberOfRules - 1)
})

it("should be able to overwrite the default level of lint rules", async () => {
	const plugin = standardLintRulesModule({
		missingMessage: "warn",
	})({} as InlangEnvironment)
	const config = await plugin.config()
	expect(config.lint?.rules).toHaveLength(totalNumberOfRules)
	const rule = config.lint!.rules.find(
		(rule) => (rule as LintRule).id === "inlang.missingMessage",
	) as LintRule
	expect(rule.level).toBe("warn")
})
