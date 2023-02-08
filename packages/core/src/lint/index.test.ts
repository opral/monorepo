import { describe, expect, it } from "vitest";
import type { Config } from '../config/schema.js';
import { lint } from './index.js';
import type { LintRuleInit } from './schema.js';

const testRule = (() => {
	let referenceLanguage: string
	let languages: string[]

	return {
		id: 'test-rule',
		initialize: (config) => {
			console.log('init');
			referenceLanguage = config.referenceLanguage
			languages = config.languages
		},
		visit: {
			Resource: {
				before: (target, reference) => {
					console.log('Resource before', target, reference);
					if (target && target.languageTag.name === referenceLanguage) return 'skip'
				},
				lint: (target, reference) => {
					console.log('Resource lint', target, reference);
				},
				after: (target, reference) => {
					console.log('Resource after', target, reference);
				}
			},
			Message: {
				before: (target, reference) => {
					console.log('Message before', target, reference);
				},
				lint: (target, reference) => {
					console.log('Message lint', target, reference);
				},
				after: (target, reference) => {
					console.log('Message after', target, reference);
				}
			},
			Pattern: {
				before: (target, reference) => {
					console.log('Pattern before', target, reference);
				},
				lint: (target, reference) => {
					console.log('Pattern lint', target, reference);
				},
				after: (target, reference) => {
					console.log('Pattern after', target, reference);
				}
			}
		},
		teardown: () => {
			console.log('teardown');
		}
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
					id: { type: "Identifier", name: "first-message" },
					pattern: {
						type: "Pattern",
						elements: [{ type: "Text", value: "Willkommen zu dieser Anwendung." }],
					},
				},
				{
					type: "Message",
					id: { type: "Identifier", name: "second-message" },
					pattern: {
						type: "Pattern",
						elements: [{ type: "Text", value: "Oops." }],
					},
				}
			],
		}]
	},
	writeResources: async () => undefined,
	lint: {
		rules: [testRule()],
	}
} satisfies Config

describe("lint", () => {
	it("lint", async () => {
		const result = await lint(dummyConfig)

		console.log(11, result);
	})
})