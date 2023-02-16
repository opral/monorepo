import { beforeEach, describe, expect, MockContext, test, vi } from "vitest";
import type { Message, Pattern, Resource } from '../ast/schema.js';
import type { Config, EnvironmentFunctions } from '../config/schema.js';
import type { Context } from './context.js';
import { getLintRulesFromConfig, lint } from './linter.js';
import { ConfiguredLintRule, createRule } from './rule.js';

describe("getLintRulesFromConfig", async () => {
	const rule1 = { id: 'rule.1' } as unknown as ConfiguredLintRule
	const rule2 = { id: 'rule.2' } as unknown as ConfiguredLintRule

	test("should return an empty `Array` if no lint attribute is present", async () => {
		const rules = getLintRulesFromConfig({} as Config)
		expect(rules).toHaveLength(0)
	})

	test("should return all specified lint rules", async () => {
		const rules = getLintRulesFromConfig({ lint: { rules: [rule1, rule2] } } as Config)
		expect(rules).toHaveLength(2)
		expect(rules[0].id).toBe(rule1.id)
		expect(rules[1].id).toBe(rule2.id)
	})

	test("should flatten lint rules", async () => {
		const rules = getLintRulesFromConfig({ lint: { rules: [[rule2], rule1] } } as Config)
		expect(rules).toHaveLength(2)
		expect(rules[0].id).toBe(rule2.id)
		expect(rules[1].id).toBe(rule1.id)
	})
})

// --------------------------------------------------------------------------------------------------------------------

vi.spyOn(console, 'warn').mockImplementation(vi.fn)
vi.spyOn(console, 'info').mockImplementation(vi.fn)

const dummyEnv: EnvironmentFunctions = {
	$fs: vi.fn() as any,
	$import: vi.fn(),
}

const doLint = (rules: ConfiguredLintRule[], resources: Resource[]) => {
	const config = ({
		referenceLanguage: resources[0]?.languageTag.name,
		languages: resources.map(resource => resource.languageTag.name),
		readResources: async () => resources,
		writeResources: async () => undefined,
		lint: { rules }
	} satisfies Config)

	return lint(config, dummyEnv)
}

const createResource = (language: string, ...messages: Message[]) => ({
	type: "Resource",
	languageTag: {
		type: "LanguageTag",
		name: language,
	},
	body: messages,
} satisfies Resource)

const createMessage = (id: string, pattern: string) => ({
	type: "Message",
	id: { type: "Identifier", name: id },
	pattern: {
		type: "Pattern",
		elements: [{ type: "Text", value: pattern }],
	},
} satisfies Message)

// --------------------------------------------------------------------------------------------------------------------

const errorRule = {
	id: 'error.rule',
	level: 'error',
	initialize: vi.fn(),
	visitors: {
		Pattern: vi.fn(),
	}
} satisfies ConfiguredLintRule

const warnRule = {
	id: 'warn.rule',
	level: 'warn',
	initialize: vi.fn(),
	visitors: {
		Pattern: vi.fn(),
	}
} satisfies ConfiguredLintRule

const disabledRule = {
	id: 'disabled.rule',
	level: false,
	initialize: vi.fn(),
	visitors: {
		Pattern: vi.fn(),
	}
} satisfies ConfiguredLintRule

const referenceResource = createResource('en', createMessage('first-message', 'Welcome to this app.'))
const targetResource = createResource('de', createMessage('first-message', 'Willkommen zu dieser Applikation.'))

// --------------------------------------------------------------------------------------------------------------------

describe("lint", async () => {
	beforeEach(() => {
		vi.resetAllMocks()
	})

	describe("rules", async () => {
		test("should be able to disable rule", async () => {
			const resources = [referenceResource]
			const result = await doLint([disabledRule], resources);

			expect(result).toMatchObject(resources)
			expect(disabledRule.visitors.Pattern).toHaveBeenCalledTimes(0)
		})

		test("should be able to override lint type", async () => {
			const rule = createRule('error.rule', 'error', () => {
				let context: Context

				return ({
					initialize: (args) => context = args.context,
					visitors: {
						Pattern: ({ target }) => context.report({ node: target!, message: 'Test' }),
					}
				})
			})

			const resources = [referenceResource]
			const result = await doLint([rule('warn')], resources);
			expect(result?.[0].body[0].pattern.lint?.[0])
				.toMatchObject({ id: 'error.rule', level: 'warn', message: 'Test' })
		})

		test("should not start linting if no rules are specified", async () => {
			const result = await doLint([], []);

			expect(result).toBeUndefined()
			expect(console.warn).toHaveBeenCalledTimes(1)
		})

		test("should process all 'Resources'", async () => {
			const resources = [referenceResource, targetResource]
			const result = await doLint([errorRule], resources);

			expect(result).toMatchObject(resources)
			expect(errorRule.visitors.Pattern).toHaveBeenCalledTimes(2)
		})

		test("should process all 'Resources' for all rules", async () => {
			const resources = [referenceResource, targetResource]
			const result = await doLint([errorRule, warnRule], resources);

			expect(result).toMatchObject(resources)
			expect(errorRule.visitors.Pattern).toHaveBeenCalledTimes(2)
			expect(warnRule.visitors.Pattern).toHaveBeenCalledTimes(2)
		})
	})

	// -----------------------------------------------------------------------------------------------------------------

	describe("visitors", () => {
		const onEnter = vi.fn()
		const onLeave = vi.fn()

		const rule = {
			id: 'lint.rule',
			level: 'error',
			initialize: () => Promise.resolve(console.info('initialize')),
			visitors: {
				Resource: {
					enter: ({ target }) => {
						onEnter(target)
						return Promise.resolve(console.info('Resource enter'))
					},
					leave: ({ target }) => {
						onLeave(target)
						return Promise.resolve(console.info('Resource leave'))
					}
				},
				Message: {
					enter: ({ target }) => {
						onEnter(target)
						return Promise.resolve(console.info('Message enter'))
					},
					leave: ({ target }) => {
						onLeave(target)
						return Promise.resolve(console.info('Message leave'))
					}
				},
				Pattern: {
					enter: ({ target }) => {
						onEnter(target)
						return Promise.resolve(console.info('Pattern enter'))
					},
					leave: ({ target }) => {
						onLeave(target)
						return Promise.resolve(console.info('Pattern leave'))
					}
				},
			},
			teardown: () => Promise.resolve(console.info('teardown')),
		} satisfies ConfiguredLintRule

		test("should visit all nodes exactly once", async () => {
			await doLint([rule], [referenceResource])

			expect(onEnter).toHaveBeenCalledTimes(3)
			expect((onEnter as unknown as MockContext<Resource, unknown>).calls[0][0])
				.toMatchObject({ type: 'Resource' })
			expect((onEnter as unknown as MockContext<Message, unknown>).calls[1][0])
				.toMatchObject({ type: 'Message' })
			expect((onEnter as unknown as MockContext<Pattern, unknown>).calls[2][0])
				.toMatchObject({ type: 'Pattern' })

			expect(onLeave).toHaveBeenCalledTimes(3)
			expect((onLeave as unknown as MockContext<Pattern, unknown>).calls[0][0])
				.toMatchObject({ type: 'Pattern' })
			expect((onLeave as unknown as MockContext<Message, unknown>).calls[1][0])
				.toMatchObject({ type: 'Message' })
			expect((onLeave as unknown as MockContext<Resource, unknown>).calls[2][0])
				.toMatchObject({ type: 'Resource' })
		})

		test("should await all functions", async () => {
			await doLint([rule], [referenceResource])

			expect(console.info).toHaveBeenNthCalledWith(1, 'initialize')
			expect(console.info).toHaveBeenNthCalledWith(2, 'Resource enter')
			expect(console.info).toHaveBeenNthCalledWith(3, 'Message enter')
			expect(console.info).toHaveBeenNthCalledWith(4, 'Pattern enter')
			expect(console.info).toHaveBeenNthCalledWith(5, 'Pattern leave')
			expect(console.info).toHaveBeenNthCalledWith(6, 'Message leave')
			expect(console.info).toHaveBeenNthCalledWith(7, 'Resource leave')
			expect(console.info).toHaveBeenNthCalledWith(8, 'teardown')
		})

		describe("should skip processing children", async () => {
			describe("if no visitor is specified", async () => {
				describe("for 'Resource'", async () => {
					test("node", async () => {
						const modifiedRule = {
							...rule, visitors: {}
						} as ConfiguredLintRule

						await doLint([modifiedRule], [referenceResource])

						expect(console.info).toHaveBeenNthCalledWith(1, 'initialize')
						expect(console.info).toHaveBeenNthCalledWith(2, 'teardown')
					})

					describe("but not if children has visitor specified", async () => {
						test("for Message", async () => {
							const modifiedRule = {
								...rule, visitors: { Message: rule.visitors.Message.enter }
							} as ConfiguredLintRule

							await doLint([modifiedRule], [referenceResource])

							expect(console.info).toHaveBeenNthCalledWith(1, 'initialize')
							expect(console.info).toHaveBeenNthCalledWith(2, 'Message enter')
							expect(console.info).toHaveBeenNthCalledWith(3, 'teardown')
						})

						test("for Pattern", async () => {
							const modifiedRule = {
								...rule, visitors: { Pattern: rule.visitors.Pattern.enter }
							} as ConfiguredLintRule

							await doLint([modifiedRule], [referenceResource])

							expect(console.info).toHaveBeenNthCalledWith(1, 'initialize')
							expect(console.info).toHaveBeenNthCalledWith(2, 'Pattern enter')
							expect(console.info).toHaveBeenNthCalledWith(3, 'teardown')
						})
					})
				})

				describe("for Message", async () => {
					test("node", async () => {
						const modifiedRule = {
							...rule, visitors: { Resource: rule.visitors.Resource.enter }
						} as ConfiguredLintRule

						await doLint([modifiedRule], [referenceResource])

						expect(console.info).toHaveBeenNthCalledWith(1, 'initialize')
						expect(console.info).toHaveBeenNthCalledWith(2, 'Resource enter')
						expect(console.info).toHaveBeenNthCalledWith(3, 'teardown')
					})

					describe("but not if children has visitor specified", async () => {
						test("for Pattern", async () => {
							const modifiedRule = {
								...rule, visitors: { Pattern: rule.visitors.Pattern.enter }
							} as ConfiguredLintRule

							await doLint([modifiedRule], [referenceResource])

							expect(console.info).toHaveBeenNthCalledWith(1, 'initialize')
							expect(console.info).toHaveBeenNthCalledWith(2, 'Pattern enter')
							expect(console.info).toHaveBeenNthCalledWith(3, 'teardown')
						})
					})
				})

				describe("for Pattern", async () => {
					test("node", async () => {
						const modifiedRule = {
							...rule, visitors: { Message: rule.visitors.Message.enter }
						} as ConfiguredLintRule

						await doLint([modifiedRule], [referenceResource])

						expect(console.info).toHaveBeenNthCalledWith(1, 'initialize')
						expect(console.info).toHaveBeenNthCalledWith(2, 'Message enter')
						expect(console.info).toHaveBeenNthCalledWith(3, 'teardown')
					})
				})
			})

			describe("if 'skip' get's returned by a visitor", async () => {
				test("for 'Resource'", async () => {
					const modifiedRule = {
						...rule,
						visitors: {
							Resource: {
								enter: (...args) => {
									rule.visitors.Resource.enter(...args)
									return 'skip'
								},
								leave: rule.visitors.Resource.leave,
							},
							Message: rule.visitors.Message.enter,
							Pattern: rule.visitors.Pattern.enter,
						}
					} as ConfiguredLintRule

					await doLint([modifiedRule], [referenceResource])

					expect(console.info).toHaveBeenNthCalledWith(1, 'initialize')
					expect(console.info).toHaveBeenNthCalledWith(2, 'Resource enter')
					expect(console.info).toHaveBeenNthCalledWith(3, 'teardown')
				})

				test("for 'Message'", async () => {
					const modifiedRule = {
						...rule,
						visitors: {
							Message: {
								enter: (...args) => {
									rule.visitors.Message.enter(...args)
									return 'skip'
								},
								leave: rule.visitors.Message.leave,
							},
							Pattern: rule.visitors.Pattern.enter,
						}
					} as ConfiguredLintRule

					await doLint([modifiedRule], [referenceResource])

					expect(console.info).toHaveBeenNthCalledWith(1, 'initialize')
					expect(console.info).toHaveBeenNthCalledWith(2, 'Message enter')
					expect(console.info).toHaveBeenNthCalledWith(3, 'teardown')
				})

				test("for 'Pattern'", async () => {
					const modifiedRule = {
						...rule,
						visitors: {
							Pattern: {
								enter: (...args) => {
									rule.visitors.Pattern.enter(...args)
									return 'skip'
								},
								leave: rule.visitors.Pattern.leave,
							}
						}
					} as ConfiguredLintRule

					await doLint([modifiedRule], [referenceResource])

					expect(console.info).toHaveBeenNthCalledWith(1, 'initialize')
					expect(console.info).toHaveBeenNthCalledWith(2, 'Pattern enter')
					expect(console.info).toHaveBeenNthCalledWith(3, 'teardown')
				})
			})
		})
	})

	// -----------------------------------------------------------------------------------------------------------------

	describe("exceptions", async () => {
		describe("should not kill process", async () => {
			test("if 'teardown' is not present", async () => {

			})

			describe("for 'Resource'", async () => {
				test("if not present", async () => {

				})

				test("if 'enter' is not present", async () => {

				})

				test("if 'leave' is not present", async () => {

				})
			})

			describe("for 'Message'", async () => {
				test("if not present", async () => {

				})

				test("if 'enter' is not present", async () => {

				})

				test("if 'leave' is not present", async () => {

				})
			})

			describe("for 'Pattern'", async () => {
				test("if not present", async () => {

				})

				test("if 'enter' is not present", async () => {

				})

				test("if 'leave' is not present", async () => {

				})
			})

			describe("if visitor throws", async () => {
				describe("in 'Resource'", async () => {
					test("'enter'", async () => {

					})

					test("'leave'", async () => {

					})
				})

				describe("in 'Message'", async () => {
					test("'enter'", async () => {

					})

					test("'leave'", async () => {

					})
				})

				describe("in 'Pattern'", async () => {
					test("'enter'", async () => {

					})

					test("'leave'", async () => {

					})
				})
			})
		})
	})

	// -----------------------------------------------------------------------------------------------------------------

	describe("payloads", async () => {
		describe("should receive the payload", async () => {
			test("in 'initialize", async () => {

			})

			describe("in 'teardown'", async () => {
				test("from the 'initialize' function", async () => {

				})

				test("'undefined' if no payload returned from 'initialize'", async () => {

				})
			})
		})

		// test pass copy instead of object reference
		// test altering payloads
		// test not returning payloads
	})
})