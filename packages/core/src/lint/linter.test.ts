import { describe, test, vi } from "vitest";
import type { Config, EnvironmentFunctions } from '../config/schema.js';
import { lint } from './linter.js';
import { inspect } from 'util';
import { parseLintSettings, Reporter } from './reporter.js';
import type { LintRuleInit } from './rule.js';

const debug = (element: unknown) => console.info(inspect(element, false, 999))

const missingKeyRule = ((settings?) => {
	const { level } = parseLintSettings(settings, 'error')

	let reporter: Reporter
	let referenceLanguage: string

	return {
		id: 'inlang.missingKey',
		level,
		initialize: async (config) => {
			reporter = config.reporter
			referenceLanguage = config.referenceLanguage
		},
		visitors: {
			Resource: ({ target }) => {
				if (target && target.languageTag.name === referenceLanguage) return 'skip'
			},
			Message: ({ target, reference }) => {
				if (!target && reference) {
					reporter.report(reference, `Message with id '${reference.id.name}' missing`)
				}
			}
		},
	}
}) satisfies LintRuleInit

const additionalKeyRule = ((settings?) => {
	const { level } = parseLintSettings(settings, 'error')

	let reporter: Reporter
	let referenceLanguage: string

	return {
		id: 'inlang.additionalKey',
		level,
		initialize: (config) => {
			reporter = config.reporter
			referenceLanguage = config.referenceLanguage
		},
		visitors: {
			Resource: ({ target }) => {
				if (target && target.languageTag.name === referenceLanguage) return 'skip'
			},
			Message: ({ target, reference }) => {
				if (!reference && target) {
					reporter.report(target, `Message with id '${target.id.name}' is specified, mut missing in the reference`)
				}
			},
		},
	}
}) satisfies LintRuleInit

const dummyEnv: EnvironmentFunctions = {
	$fs: vi.fn() as any,
	$import: vi.fn(),
}

const dummyConfig = {
	referenceLanguage: 'en',
	languages: ['en', 'de'],
	readResources: async () => {
		return [{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "en",
			},
			body: [
				{
					type: "Message",
					id: { type: "Identifier", name: "first-message" },
					pattern: {
						type: "Pattern",
						elements: [{ type: "Text", value: "Welcome to this app." }],
					},
				}
			],
		},
		{
			type: "Resource",
			languageTag: {
				type: "LanguageTag",
				name: "de",
			},
			body: [
				{
					type: "Message",
					id: { type: "Identifier", name: "second-message" },
					pattern: {
						type: "Pattern",
						elements: [{ type: "Text", value: "Test" }],
					},
				}
			],
		}]
	},
	writeResources: async () => undefined,
	lint: {
		rules: [
			missingKeyRule('warning'),
			additionalKeyRule(),
		],
	}
} satisfies Config

test("debug code", async () => {
	const result = await lint(dummyConfig, dummyEnv)
	debug(result)
})

// --------------------------------------------------------------------------------------------------------------------

describe("rules", async () => {
	test("should be able to disable rule", async () => {

	})

	test("should be able to override lint type", async () => {

	})

	test("should not start linting if no rules are specified", async () => {

	})

	test("should process all 'Resources'", async () => {

	})

	test("should process all 'Resources' for all rules", async () => {

	})
})

// --------------------------------------------------------------------------------------------------------------------

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

// --------------------------------------------------------------------------------------------------------------------

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

// --------------------------------------------------------------------------------------------------------------------

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