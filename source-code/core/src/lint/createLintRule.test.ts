/* eslint-disable @typescript-eslint/no-empty-function */
import { expect, test } from "vitest"
import { createLintRule } from "./createLintRule.js"

test("createLintRule returns a function", () => {
	const myRule = createLintRule({
		id: "example.rule",
		setup: () => {
			return {
				visitors: {
					Resource: () => {},
				},
			}
		},
	})

	expect(typeof myRule).toBe("function")
})

test("createLintRule configures lint rule with correct id and level", async () => {
	const myRule = createLintRule({
		id: "example.rule",
		setup: () => {
			return {
				visitors: {
					Resource: () => {},
				},
			}
		},
	})

	const rule = myRule("error")
	expect(rule.id).toBe("example.rule")
	expect(rule.level).toBe("error")
})

test("createLintRule configures lint rule with correct visitors", async () => {
	const myRule = createLintRule({
		id: "example.rule",
		setup: () => {
			return {
				visitors: {
					Resource: () => {},
				},
			}
		},
	})
	const rule = myRule("error")
	const { visitors } = await rule.setup({
		report: () => {},
		config: { referenceLanguage: "en", languages: ["en", "de"] },
	})
	expect(typeof visitors.Resource).toBe("function")
})

test("createLintRule should accept an async setup function", async () => {
	const myRule = createLintRule({
		id: "example.rule",
		setup: () => {
			return {
				visitors: {
					Resource: () => {},
				},
			}
		},
	})
	const rule = myRule("error")
	expect(typeof rule.setup).toBe("function")
	const { visitors } = await rule.setup({
		report: () => {},
		config: { referenceLanguage: "en", languages: ["en", "de"] },
	})
	expect(typeof visitors.Resource).toBe("function")
})
