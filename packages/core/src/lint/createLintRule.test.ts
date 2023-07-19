/* eslint-disable @typescript-eslint/no-empty-function */
import { expect, test } from "vitest"
import { createLintRule } from "./createLintRule.js"

test("createLintRule returns a function", () => {
	const myRule = createLintRule(() => ({
		id: "example.rule",
		message: () => undefined,
	}))

	expect(typeof myRule).toBe("function")
})

test("createLintRule configures lint rule with correct id and level", async () => {
	const myRule = createLintRule(() => ({
		id: "example.rule",
		message: () => undefined,
	}))

	const rule = myRule("error")
	expect(rule.id).toBe("example.rule")
	expect(rule.level).toBe("error")
})

test("createLintRule configures lint rule with correct callbacks", async () => {
	const myRule = createLintRule(() => ({
		id: "example.rule",
		message: () => undefined,
	}))
	const rule = myRule("error")
	expect(typeof rule.message).toBe("function")
})
