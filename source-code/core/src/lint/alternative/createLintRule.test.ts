/* eslint-disable @typescript-eslint/no-empty-function */
import { expect, test } from "vitest"
import { createLintRule } from "./createLintRule.js"

test("createLintRule returns a function", () => {
	const myRule = createLintRule({ id: "example.rule" }, async () => {
		return {
			visitors: {
				Resource: () => {},
			},
		}
	})

	expect(typeof myRule).toBe("function")
})

test("createLintRule configures lint rule with correct id and level", async () => {
	const myRule = createLintRule({ id: "example.rule" }, async () => {
		return {
			visitors: {
				Resource: () => {},
			},
		}
	})

	const setup = myRule("error", {})
	const rule = await setup({ config: { referenceLanguage: "en", languages: ["en", "de"] } })

	expect(rule.id).toBe("example.rule")
	expect(rule.level).toBe("error")
})

test("createLintRule configures lint rule with correct visitors", async () => {
	const myRule = createLintRule({ id: "example.rule" }, async () => {
		return {
			visitors: {
				Resource: () => {},
			},
		}
	})

	const setup = myRule("error", {})
	const rule = await setup({ config: { referenceLanguage: "en", languages: ["en", "de"] } })

	expect(typeof rule.visitors.Resource).toBe("function")
})
