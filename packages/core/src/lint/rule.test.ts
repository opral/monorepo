import { beforeEach, describe, expect, test, vi } from "vitest";
import { ConfiguredLintRule, createRule } from './rule.js';

const initialize = () => undefined
const visitors = {}

const rule1 = createRule('my.id', 'error', () => {
	return {
		initialize,
		visitors,
	}
})

const teardown = () => undefined
const rule2 = createRule('my.id', 'error', (options) => {
	return {
		initialize: () => console.log(options),
		visitors,
		teardown,
	}
})

// --------------------------------------------------------------------------------------------------------------------

vi.spyOn(console, 'log').mockImplementation(vi.fn)

describe("createRule", async () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	describe("calling the function should", async () => {
		describe("return an object with", async () => {
			test("the correct id", async () => {
				const configuredRule = rule1()

				expect(configuredRule.id).toBe('my.id')
			})

			test("the correct level", async () => {
				const configuredRule = rule1()

				expect(configuredRule.level).toBe('error')
			})

			test("the passed `initialize` function", async () => {
				const configuredRule = rule1()

				expect(configuredRule.initialize).toBe(initialize)
			})

			test("the passed visitors", async () => {
				const configuredRule = rule1()

				expect(configuredRule.visitors).toBe(visitors)
			})

			test("no `teardown` function if not passed", async () => {
				const configuredRule = rule1()

				expect(configuredRule.teardown).toBeUndefined()
			})

			test("the passed `teardown` function if passed", async () => {
				const configuredRule = rule2()

				expect(configuredRule.teardown).toBe(teardown)
			})
		})

		describe("respect params and", async () => {
			test("change log level if specified", async () => {
				const configuredRule = rule1('warn')

				expect(configuredRule.level).toBe('warn')
			})

			test("pass `undefined` for options if not specified", async () => {
				const configuredRule = rule2('error')

				configuredRule.initialize(...([] as unknown as Parameters<ConfiguredLintRule['initialize']>))

				expect(console.log).toHaveBeenCalledOnce()
				expect(console.log).toHaveBeenCalledWith(undefined)
			})

			test("pass the options object if defined", async () => {
				const options = {
					some: 'option',
					debug: true
				}
				const configuredRule = rule2('error', options)

				configuredRule.initialize(...([] as unknown as Parameters<ConfiguredLintRule['initialize']>))

				expect(console.log).toHaveBeenCalledOnce()
				expect(console.log).toHaveBeenCalledWith(options)
			})
		})
	})
})
