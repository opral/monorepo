import { beforeEach, describe, expect, test, vi } from "vitest";
import type { LintRule, LintRuleInitializer } from './rule.js';
import { createLintRuleCollection } from './ruleCollection.js';
import { parseLintConfigArguments } from './context.js';

const rule1Id = "rule.1"
const rule2Id = "rule.2"

const rule1 = ((...args) => {
	const { level, settings } = parseLintConfigArguments(args, 'error')

	return {
		id: rule1Id,
		level,
		setup: async () => console.log(settings),
		visitors: {}
	}
}) satisfies LintRuleInitializer<any>

const rule2 = ((...settings) => {
	const { level } = parseLintConfigArguments(settings, 'warn')

	return {
		id: rule2Id,
		level,
		setup: () => undefined,
		visitors: {}
	}
}) satisfies LintRuleInitializer

const collection = createLintRuleCollection({
	rule1,
	rule2,
})

vi.spyOn(console, 'log').mockImplementation(vi.fn)

// --------------------------------------------------------------------------------------------------------------------

describe("createLintRuleCollection", async () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	test("once called, should return an `Array` of all specified rules", async () => {
		const rules = collection()

		expect(rules).toHaveLength(2)
		expect(rules[0].id).toBe(rule1Id)
		expect(rules[1].id).toBe(rule2Id)
	})

	describe("should use defaults when nothing gets passed", async () => {
		test("globally", async () => {
			const rules = collection()

			expect(rules[0].level).toBe('error')
			expect(rules[1].level).toBe('warn')
		})

		test("for a specific rule", async () => {
			const rules = collection({ rule2: 'error' })

			expect(rules[0].level).toBe('error')
			expect(rules[1].level).toBe('error')
		})
	})

	describe("should pass the correct settings to each lint rule", async () => {
		describe("single param", async () => {
			test("'false'", async () => {
				const rules = collection({ rule1: false })

				expect(rules[0].level).toBe(false)
			})

			test("'true'", async () => {
				const rules = collection({ rule1: true })

				expect(rules[0].level).toBe('error')
			})

			test("'error'", async () => {
				const rules = collection({ rule2: 'error' })

				expect(rules[1].level).toBe('error')
			})

			test("'warn'", async () => {
				const rules = collection({ rule1: 'warn' })

				expect(rules[0].level).toBe('warn')
			})
		})

		describe("as tuple with single entry", async () => {
			test("'false'", async () => {
				const rules = collection({ rule1: [false] })

				expect(rules[0].level).toBe(false)
			})

			test("'true'", async () => {
				const rules = collection({ rule1: [true] })

				expect(rules[0].level).toBe('error')
			})

			test("'error'", async () => {
				const rules = collection({ rule2: ['error'] })

				expect(rules[1].level).toBe('error')
			})

			test("'warn'", async () => {
				const rules = collection({ rule1: ['warn'] })

				expect(rules[0].level).toBe('warn')
			})
		})

		test("pass rule specific settings", async () => {
			const settings = {
				some: 'option',
				debug: true
			}
			const rules = collection({ rule1: ['warn', settings] })

			rules[0].setup(...([] as unknown as Parameters<LintRule['setup']>))

			expect(console.log).toHaveBeenCalledOnce()
			expect(console.log).toHaveBeenCalledWith(settings)
		})
	})
})
