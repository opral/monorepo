import { createLintRule } from "./createLintRule.js"
import { expectType } from "tsd"

const rule = createLintRule({
	id: "example.rule",
	setup: ({ settings }) => {
		expectType<undefined>(settings)
		return {
			visitors: {
				Resource: () => undefined,
			},
		}
	},
})

const ruleWithSettings = createLintRule<{ strict: boolean }>({
	id: "example.rule",
	setup: ({ settings }) => {
		// if settings is defined, it must be an object
		expectType<object>(settings)
		// if settings is defined, it must have a strict property
		expectType<boolean>(settings.strict)
		return {
			visitors: {
				Resource: () => undefined,
			},
		}
	},
})

// ------------------------ TESTS ------------------------

// @ts-expect-error - The lint level must be defined.
rule()

rule("error")

// @ts-expect-error - "hint" is not a valid level
rule("hint")

// @ts-expect-error - Settings can't be defined if not specified in createLintRule
rule("error", { strict: true })

// @ts-expect-error - Settings must be defined.
ruleWithSettings("error")

// @ts-expect-error - Number can't be assigned to boolean
ruleWithSettings("error", { strict: 5 })
