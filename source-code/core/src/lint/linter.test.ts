import { beforeEach, describe, expect, test, vi } from "vitest";
import type { Message, Resource } from '../ast/schema.js';
import type { Config, EnvironmentFunctions } from '../config/schema.js';
import type { Context } from './context.js';
import { lint } from './linter.js';
import { ConfiguredLintRule, createRule } from './rule.js';
import { debug } from './_utilities.js';

vi.spyOn(console, 'warn')

const dummyEnv: EnvironmentFunctions = {
	$fs: vi.fn() as any,
	$import: vi.fn(),
}

const doLint = (rules: ConfiguredLintRule[], resources: Resource[]) => {
	const config = ({
		referenceLanguage: 'en',
		languages: ['en', 'de'],
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

const warningRule = {
	id: 'warning.rule',
	level: 'warning',
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
			const result = await doLint([rule('warning')], resources);
			expect(result?.[0].body[0].pattern.lint?.[0])
				.toMatchObject({ id: 'error.rule', level: 'warning', message: 'Test' })
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
			const result = await doLint([errorRule, warningRule], resources);

			expect(result).toMatchObject(resources)
			expect(errorRule.visitors.Pattern).toHaveBeenCalledTimes(2)
			expect(warningRule.visitors.Pattern).toHaveBeenCalledTimes(2)
		})
	})

	// -----------------------------------------------------------------------------------------------------------------

	describe("visitors", () => {
		test("should visit all nodes exactly once", async () => {

		})

		describe("should await", async () => {
			test("'initialize'", async () => {

			})

			test("'teardown'", async () => {

			})

			describe("'Resource'", async () => {
				test("'enter'", async () => {

				})

				test("'leave'", async () => {

				})
			})

			describe("'Message'", async () => {
				test("'enter'", async () => {

				})

				test("'leave'", async () => {

				})
			})

			describe("'Pattern'", async () => {
				test("'enter'", async () => {

				})

				test("'leave'", async () => {

				})
			})
		})

		describe("should skip processing children", async () => {
			describe("if no visitor is specified", async () => {
				describe("for 'Resource'", async () => {
					test("node", async () => {

					})

					describe("but not if children has visitor specified", async () => {
						test("for Message", async () => {

						})

						test("for Pattern", async () => {

						})
					})
				})

				describe("for Message", async () => {
					test("node", async () => {

					})

					describe("but not if children has visitor specified", async () => {
						test("for Pattern", async () => {

						})
					})
				})

				describe("for Pattern", async () => {
					test("node", async () => {

					})
				})
			})

			describe("if 'skip' get's returned by a visitor", async () => {
				test("for 'Resource'", async () => {

				})

				test("for 'Message'", async () => {

				})

				test("for 'Pattern'", async () => {

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