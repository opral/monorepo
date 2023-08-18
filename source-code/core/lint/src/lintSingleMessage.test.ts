import { beforeEach, describe, expect, test, vi } from "vitest"
import { lintSingleMessage } from "./lintSingleMessage.js"
import type { MessageLintReport, MessageLintRule } from "./api.js"
import type { InlangConfig } from "@inlang/config"
import type { Message, MessageQueryApi } from "@inlang/messages"

const lintRule1 = {
	meta: {
		id: "r.lintRule.1",
		displayName: { en: "" },
		description: { en: "" },
	},
	type: "MessageLint",
	message: vi.fn(),
} satisfies MessageLintRule

const lintRule2 = {
	meta: {
		id: "r.lintRule.2",
		displayName: { en: "" },
		description: { en: "" },
	},
	type: "MessageLint",
	message: vi.fn(),
} satisfies MessageLintRule

const message1 = {} as Message

const messages = [message1]

describe("lintSingleMessage", async () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	describe("resolve rules and settings", async () => {
		test("it should not run disabled lintrules", async () => {
			await lintSingleMessage({
				config: {
					settings: { "system.lint.ruleLevels": { [lintRule1.meta.id]: "off" } } satisfies Partial<
						InlangConfig["settings"]
					>,
				} as unknown as InlangConfig,
				query: {} as MessageQueryApi,
				messages,
				message: message1,
				rules: [lintRule1, lintRule2],
			})

			expect(lintRule1.message).not.toHaveBeenCalled()
			expect(lintRule2.message).toHaveBeenCalledOnce()
		})

		test("it should set the default lint level to warning if not defined in system.lint.ruleLevels", async () => {
			lintRule1.message.mockImplementation(({ report }) => report({} as MessageLintReport))

			const reports = await lintSingleMessage({
				config: {} as InlangConfig,
				query: {} as MessageQueryApi,
				messages,
				message: message1,
				rules: [lintRule1],
			})

			expect(reports.data[0]?.level).toBe("warning")
		})

		test("it should override the default lint level", async () => {
			lintRule1.message.mockImplementation(({ report }) => report({} as MessageLintReport))

			const reports = await lintSingleMessage({
				config: {
					settings: { "system.lintRuleLevels": { [lintRule1.meta.id]: "error" } } as Partial<
						InlangConfig["settings"]
					>,
				} as InlangConfig,
				query: {} as MessageQueryApi,
				messages,
				message: message1,
				rules: [lintRule1],
			})
			expect(reports.data[0]?.level).toBe("error")
		})

		test.only("it should pass the correct settings", async () => {
			const settings = {}

			const fn = vi.fn()
			lintRule1.message.mockImplementation(({ settings }) => fn(settings))

			await lintSingleMessage({
				config: {
					settings: { [lintRule1.meta.id]: settings } as Partial<InlangConfig["settings"]>,
				} as InlangConfig,
				query: {} as MessageQueryApi,
				messages,
				message: message1,
				rules: [lintRule1],
			})

			expect(fn).toHaveBeenCalledWith(settings)
		})
	})

	test("it should await all rules", async () => {
		let m1Called = false
		let m2Called = false
		lintRule1.message.mockImplementation(() => {
			m1Called = true
		})
		lintRule2.message.mockImplementation(async () => {
			await new Promise((resolve) => setTimeout(resolve, 0))
			m2Called = true
		})

		await lintSingleMessage({
			config: {} as InlangConfig,
			query: {} as MessageQueryApi,
			messages,
			message: message1,
			rules: [lintRule1, lintRule2],
		})

		expect(m1Called).toBe(true)
		expect(m2Called).toBe(true)
	})

	test("it should process all rules in parallel", async () => {
		const fn = vi.fn()

		lintRule1.message.mockImplementation(async () => {
			fn(lintRule1.meta.id, "before")
			await new Promise((resolve) => setTimeout(resolve, 0))
			fn(lintRule1.meta.id, "after")
		})
		lintRule2.message.mockImplementation(async () => {
			fn(lintRule2.meta.id, "before")
			await new Promise((resolve) => setTimeout(resolve, 0))
			fn(lintRule2.meta.id, "after")
		})

		await lintSingleMessage({
			config: {} as InlangConfig,
			query: {} as MessageQueryApi,
			messages,
			message: message1,
			rules: [lintRule1, lintRule2],
		})

		expect(fn).toHaveBeenCalledTimes(4)
		expect(fn).toHaveBeenNthCalledWith(1, lintRule1.meta.id, "before")
		expect(fn).toHaveBeenNthCalledWith(2, lintRule2.meta.id, "before")
		expect(fn).toHaveBeenNthCalledWith(3, lintRule1.meta.id, "after")
		expect(fn).toHaveBeenNthCalledWith(4, lintRule2.meta.id, "after")
	})

	test("it should not abort the linting process when errors occur", async () => {
		lintRule1.message.mockImplementation(() => {
			throw new Error("error")
		})

		lintRule2.message.mockImplementation(({ report }) => {
			report({} as MessageLintReport)
		})

		const result = await lintSingleMessage({
			config: {} as InlangConfig,
			query: {} as MessageQueryApi,
			messages,
			message: message1,
			rules: [lintRule1, lintRule2],
		})

		expect(result.data).length(1)
		expect(result.errors).length(1)
	})
})
