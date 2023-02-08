import { describe, expect, it } from "vitest";
import type { Config } from '../config/schema.js';
import { lint } from './index.js';
import { inspect } from 'util';
import type { LintRuleInit, Reporter } from './schema.js';


const debug = (element: unknown) => console.info(inspect(element, false, 999))

const missingKeyRule = (() => {
	let reporter: Reporter
	let referenceLanguage: string

	return {
		id: 'missingKey',
		initialize: (config) => {
			reporter = config.reporter
			referenceLanguage = config.referenceLanguage
		},
		visitors: {
			Resource: {
				before: (target, _reference, _payload) => {
					if (target && target.languageTag.name === referenceLanguage) return 'skip'
				},
			},
			Message: {
				visit: (target, reference, _payload) => {
					if (!target) {
						reporter.reportError(reference, `Message with id '${reference?.id.name}' missing`)
					}
				},
			},
		},
	}
}) satisfies LintRuleInit

const additionalKeyRule = (() => {
	let reporter: Reporter
	let referenceLanguage: string

	return {
		id: 'additionalKey',
		initialize: (config) => {
			reporter = config.reporter
			referenceLanguage = config.referenceLanguage
		},
		visitors: {
			Resource: {
				before: (target, _reference, _payload) => {
					if (target && target.languageTag.name === referenceLanguage) return 'skip'
				},
			},
			Message: {
				visit: (target, reference, _payload) => {
					if (!reference) {
						reporter.reportError(target, `Message with id '${target?.id.name}' is specified, mut missing in the reference`)
					}
				},
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
			missingKeyRule(),
			additionalKeyRule(),
		],
	}
} satisfies Config

describe("lint", () => {
	it("lint", async () => {
		const result = await lint(dummyConfig)

		debug(result);
	})
})