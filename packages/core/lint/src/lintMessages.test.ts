import { beforeEach, describe, expect, test, vi } from "vitest"
import { lintMessages } from "./lintMessages.js"
import type { MessageLintReport, MessageLintRule } from './api.js'
import type { Message, MessageQueryApi } from '@inlang/messages'
import type { InlangConfig } from '@inlang/config'

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

const message1 = { id: 'm1' } as Message
const message2 = { id: 'm2' } as Message
const message3 = { id: 'm3' } as Message

const messages = [message1, message2, message3]

describe("lintMessages", async () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	test("it should await all messages", async () => {
		let called = 0
		lintRule2.message.mockImplementation(async ({ message, report }) => {
			await new Promise(resolve => setTimeout(resolve, 0))
			called++
		})

		await lintMessages({
			config: {} as InlangConfig,
			query: {} as MessageQueryApi,
			messages,
			rules: [lintRule1, lintRule2],
		})

		expect(lintRule1.message).toHaveBeenCalledTimes(3)
		expect(called).toBe(3)
	})

	test("it should process all messages and rules in parallel", async () => {
		const fn = vi.fn()

		lintRule1.message.mockImplementation(async ({ message }) => {
			fn('r1', 'before', message.id)
			await new Promise(resolve => setTimeout(resolve, 0))
			fn('r1', 'after', message.id)
		})
		lintRule2.message.mockImplementation(async ({ message }) => {
			fn('r2', 'before', message.id)
			await new Promise(resolve => setTimeout(resolve, 0))
			fn('r2', 'after', message.id)
		})

		await lintMessages({
			config: {} as InlangConfig,
			query: {} as MessageQueryApi,
			messages,
			rules: [lintRule1, lintRule2],
		})

		expect(fn).toHaveBeenCalledTimes(12)
		expect(fn).toHaveBeenNthCalledWith(1, 'r1', 'before', 'm1')
		expect(fn).toHaveBeenNthCalledWith(2, 'r2', 'before', 'm1')
		expect(fn).toHaveBeenNthCalledWith(3, 'r1', 'before', 'm2')
		expect(fn).toHaveBeenNthCalledWith(4, 'r2', 'before', 'm2')
		expect(fn).toHaveBeenNthCalledWith(5, 'r1', 'before', 'm3')
		expect(fn).toHaveBeenNthCalledWith(6, 'r2', 'before', 'm3')
		expect(fn).toHaveBeenNthCalledWith(7, 'r1', 'after', 'm1')
		expect(fn).toHaveBeenNthCalledWith(8, 'r2', 'after', 'm1')
		expect(fn).toHaveBeenNthCalledWith(9, 'r1', 'after', 'm2')
		expect(fn).toHaveBeenNthCalledWith(10, 'r2', 'after', 'm2')
		expect(fn).toHaveBeenNthCalledWith(11, 'r1', 'after', 'm3')
		expect(fn).toHaveBeenNthCalledWith(12, 'r2', 'after', 'm3')
	})

	test("it should not abort the linting process when errors occur", async () => {
		lintRule1.message.mockImplementation(({ report }) => {
			report({} as MessageLintReport)
		})
		lintRule2.message.mockImplementation(({ }) => {
			throw new Error('error')
		})

		const { data, errors } = await lintMessages({
			config: {} as InlangConfig,
			query: {} as MessageQueryApi,
			messages,
			rules: [lintRule1, lintRule2],
		})

		expect(data).toHaveLength(3)
		expect(errors).toHaveLength(3)
	})
})
