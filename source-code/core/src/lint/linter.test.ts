import { describe, test } from "vitest";
import type { Config } from '../config/schema.js';
import { lint } from './linter.js';
import { inspect } from 'util';
import type { LintRuleInit } from './schema.js';
import { parseLintSettings, Reporter } from './reporter.js';

const debug = (element: unknown) => console.info(inspect(element, false, 999))

const missingKeyRule = ((settings?) => {
	const { level } = parseLintSettings(settings, 'error')

	let reporter: Reporter
	let referenceLanguage: string

	return {
		id: 'missingKey',
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
		id: 'additionalKey',
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
	const result = await lint(dummyConfig)
	debug(result)
})

describe("lint", () => {
	describe("rules", async () => {
		test("should not start linting if no rules are specified", async () => {

		})

		test("should process all resources", async () => {

		})

		test("should process all resources for all rules", async () => {

		})
	})

	describe("initialize", async () => {
		test("should call 'initialize' with all params", async () => {

		})
	})

	describe("teardown", async () => {
		test("should call 'teardown' if present", async () => {

		})

	})

	describe("visitors", () => {
		test("should visit all nodes exactly once", async () => {

		})

		describe("should await", async () => {
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

	describe("reporter", async () => {
		test("should leave original resources untouched and operate on a copy", async () => {

		})

		test("should be able to disable rule", async () => {

		})

		test("should be able to override lint type", async () => {

		})

		describe("should attach 'lint' attribute", async () => {
			test("to 'Resource' node", async () => {

			})

			test("to 'Message' node", async () => {

			})

			test("to 'Pattern' node", async () => {

			})
		})
	})

	describe("exceptions", async () => {
		describe("should not kill process", async () => {
			test("if 'teardown' is not present", async () => {

			})

			describe("in 'Resource'", async () => {
				test("if 'enter' is not present", async () => {

				})

				test("if 'leave' is not present", async () => {

				})
			})

			describe("in 'Message'", async () => {
				test("if 'enter' is not present", async () => {

				})

				test("if 'leave' is not present", async () => {

				})
			})

			describe("in 'Pattern'", async () => {
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

			test("if no node gets passed to the reporter", async () => {

			})
		})
	})

	describe("payloads", async () => {
		describe("should receive the payload", async () => {
			describe("in teardown", async () => {
				test("from the 'initialize' function", async () => {

				})
			})
		})

		// test pass copy instead of object reference
		// test altering payloads
		// test not returning payloads
	})
})