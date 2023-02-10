import { test, vi } from "vitest";
import type { Config, EnvironmentFunctions } from '../config/schema.js';
import { lint } from './linter.js';
import { inspect } from 'util';
import { createRuleCollection } from './ruleCollection.js';
import { additionalKeyRule } from './rules/additionalKey.js';
import { missingKeyRule } from './rules/missingKey.js';
import { createBrandingRule } from './rules/brandingRule.js';

const debug = (element: unknown) => console.info(inspect(element, false, 999))

const standardRules = createRuleCollection({
	missingKeyRule,
	additionalKeyRule,
});

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
						elements: [{ type: "Text", value: "Welcome to this Redbull app." }],
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
			standardRules(),
			// missingKeyRule('warning'),
			// additionalKeyRule(true),
			createBrandingRule('Red Bull', ['redbull', 'RedBull', 'Redbull'])(),
		],
	}
} satisfies Config

test("debug code", async () => {
	const result = await lint(dummyConfig, dummyEnv)
	debug(result)
})
