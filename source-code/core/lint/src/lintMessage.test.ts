import { beforeEach, describe, expect, test, vi } from "vitest"
import { lintMessage } from "./lintMessage.js"
import type { MessageLintReport, MessageLintRule } from './api.js'
import type { InlangConfig } from '@inlang/config'
import type { Message, MessageQueryApi } from '@inlang/messages'

const lintRule1 = {
	meta: {
		id: 'lint-rule.1',
		displayName: { en: '', }, description: { en: '', },
	},
	defaultLevel: 'error',
	message: vi.fn(),
} satisfies MessageLintRule

const lintRule2 = {
	meta: {
		id: 'lint-rule.2',
		displayName: { en: '', }, description: { en: '', },
	},
	defaultLevel: 'warning',
	message: vi.fn(),
} satisfies MessageLintRule

const message1 = {} as Message

const messages = [message1]

describe("lintMessage", async () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	test("it should await all rules", async () => {
		let m1Called = false
		let m2Called = false
		lintRule1.message.mockImplementation(() => {
			m1Called = true
		})
		lintRule2.message.mockImplementation(async () => {
			await new Promise(resolve => setTimeout(resolve, 0))
			m2Called = true
		})

		await lintMessage({
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
			fn('r1', 'before')
			await new Promise(resolve => setTimeout(resolve, 0))
			fn('r1', 'after')
		})
		lintRule2.message.mockImplementation(async () => {
			fn('r2', 'before')
			await new Promise(resolve => setTimeout(resolve, 0))
			fn('r2', 'after')
		})

		await lintMessage({
			config: {} as InlangConfig,
			query: {} as MessageQueryApi,
			messages,
			message: message1,
			rules: [lintRule1, lintRule2],
		})

		expect(fn).toHaveBeenCalledTimes(4)
		expect(fn).toHaveBeenNthCalledWith(1, 'r1', 'before')
		expect(fn).toHaveBeenNthCalledWith(2, 'r2', 'before')
		expect(fn).toHaveBeenNthCalledWith(3, 'r1', 'after')
		expect(fn).toHaveBeenNthCalledWith(4, 'r2', 'after')
	})

	test("it should not abort the linting process when errors occur", async () => {
		lintRule1.message.mockImplementation(() => {
			throw new Error('error')
		})

		lintRule2.message.mockImplementation(({ report }) => {
			report({} as MessageLintReport)
		})

		const result = await lintMessage({
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
