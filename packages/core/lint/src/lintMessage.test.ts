import { beforeEach, describe, expect, test, vi } from "vitest"
import { lintMessage } from "./lintMessage.js"
import type { MessageLintRule } from './api.js'
import type { InlangConfig } from '@inlang/config'
import { Message, createQuery } from '@inlang/messages'

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
			messages,
			query: createQuery(messages),
			message: message1,
			rules: [lintRule1, lintRule2],
		})

		expect(m1Called).toBe(true)
		expect(m2Called).toBe(true)
	})

	test("it should process all rules in parallel", async () => {
		const fn = vi.fn()

		lintRule1.message.mockImplementation(async () => {
			fn(1)
			await new Promise(resolve => setTimeout(resolve, 0))
			fn(3)
		})
		lintRule2.message.mockImplementation(async () => {
			fn(2)
			await new Promise(resolve => setTimeout(resolve, 0))
			fn(4)
		})

		await lintMessage({
			config: {} as InlangConfig,
			messages,
			query: createQuery(messages),
			message: message1,
			rules: [lintRule1, lintRule2],
		})

		expect(fn).toHaveBeenNthCalledWith(1, 1)
		expect(fn).toHaveBeenNthCalledWith(2, 2)
		expect(fn).toHaveBeenNthCalledWith(3, 3)
		expect(fn).toHaveBeenNthCalledWith(4, 4)
	})

	test("it should not abort the linting process when errors occur", async () => {
		lintRule1.message.mockImplementation(() => {
			throw new Error('error')
		})

		lintRule2.message.mockImplementation(({ report }) => {
			report({ messageId: 'm2', languageTag: '', body: { en: '' } })
		})

		const result = await lintMessage({
			config: {} as InlangConfig,
			messages,
			query: createQuery(messages),
			message: message1,
			rules: [lintRule1, lintRule2],
		})

		expect(result.data).length(1)
		expect(result.errors).length(1)
	})
})
