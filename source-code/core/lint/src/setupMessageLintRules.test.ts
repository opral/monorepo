import { beforeEach, describe, expect, test, vi } from "vitest"
import { setupMessageLintRules } from "./setupMessageLintRules.js"
import type { MessageLintRule } from "./api.js"

const lintRuleWithoutSetup = {
	meta: {
		id: "lint-rule.without-setup",
		displayName: { en: "" },
		description: { en: "" },
	},
	defaultLevel: "error",
	message: vi.fn(),
} satisfies MessageLintRule

const lintRule1 = {
	meta: {
		id: "lint-rule.1",
		displayName: { en: "" },
		description: { en: "" },
	},
	defaultLevel: "error",
	setup: vi.fn(),
	message: vi.fn(),
} satisfies MessageLintRule

const lintRule2 = {
	meta: {
		id: "lint-rule.2",
		displayName: { en: "" },
		description: { en: "" },
	},
	defaultLevel: "warning",
	setup: vi.fn(),
	message: vi.fn(),
} satisfies MessageLintRule

describe("setupMessageLintRules", async () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	test("it should not fail if setup function is missing", async () => {
		expect(
			async () =>
				await setupMessageLintRules({
					rules: [lintRuleWithoutSetup],
					settings: {},
				}),
		).not.toThrow()
	})

	test("it should call all setup functions", async () => {
		await setupMessageLintRules({
			rules: [lintRule1, lintRule2],
			settings: {},
		})

		expect(lintRule1.setup).toHaveBeenCalled()
		expect(lintRule2.setup).toHaveBeenCalled()
	})

	test("it should await setup functions", async () => {
		let called = false
		lintRule2.setup.mockImplementation(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0))
			called = true
		})

		await setupMessageLintRules({
			rules: [lintRule2],
			settings: {},
		})

		expect(lintRule2.setup).toHaveBeenCalled()
		expect(called).toBe(true)
	})

	test("it should not return disabled lintrules", async () => {
		const rules = await setupMessageLintRules({
			rules: [lintRule1],
			settings: { "lint-rule.1": { level: "off" } },
		})

		expect(rules).toHaveLength(0)
	})

	test("it should set the default lint level", async () => {
		const rules = await setupMessageLintRules({
			rules: [lintRule1],
			settings: {},
		})

		expect(rules[0]!.level).toBe("error")
	})

	test("it should override the default lint level", async () => {
		const rules = await setupMessageLintRules({
			rules: [lintRule1],
			settings: { "lint-rule.1": { level: "warning" } },
		})

		expect(rules[0]!.level).toBe("warning")
	})

	test("it should pass the correct options", async () => {
		const options = {}
		const rules = await setupMessageLintRules({
			rules: [lintRule1],
			settings: { "lint-rule.1": { options } },
		})

		expect(rules[0]!.setup).toHaveBeenCalledWith({ options })
	})

	test.todo("it should cache multiple setup calls the correct options", async () => {
		let value
		lintRule1.setup.mockImplementation(async () => {
			value = Math.random()
		})

		await setupMessageLintRules({
			rules: [lintRule1],
			settings: {},
		})

		const valueAfterSetup = value

		await setupMessageLintRules({
			rules: [lintRule1],
			settings: {},
		})

		expect(valueAfterSetup).toBe(value)
	})
})
