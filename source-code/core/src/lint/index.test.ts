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
			referenceLanguage = config.referenceLanguage
			languages = config.languages
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