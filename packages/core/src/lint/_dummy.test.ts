import { test, vi } from "vitest";
import type { Config, EnvironmentFunctions } from '../config/schema.js';
import { lint } from './linter.js';
import { inspect } from 'util';
import type { Reporter } from './reporter.js';
import { createRule, LintRule } from './rule.js';
import { createRuleCollection } from './ruleCollection.js';

const debug = (element: unknown) => console.info(inspect(element, false, 999))

const missingKeyRule = createRule('inlang.missingKey', () => {
	let reporter: Reporter
	let referenceLanguage: string

	return {
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
}) satisfies LintRule

const additionalKeyRule = createRule<{ test: boolean }>(
	'inlang.additionalKey',
	(options) => {
		let reporter: Reporter
		let referenceLanguage: string

		if (options?.test) {
			console.log('test')
		}

		return {
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
	})

export const standardRules = createRuleCollection({
	missingKeyRule: missingKeyRule,
	missingKeyRule1: missingKeyRule,
	missingKeyRule2: missingKeyRule,
	missingKeyRule3: missingKeyRule,
	additionalKeyRule: additionalKeyRule,
	additionalKeyRule1: additionalKeyRule,
	additionalKeyRule2: additionalKeyRule,
	additionalKeyRule3: additionalKeyRule,
	additionalKeyRule4: additionalKeyRule,
});

standardRules({
	missingKeyRule: false,
	missingKeyRule1: 'error',
	missingKeyRule2: ['error'],
	// @ts-expect-error
	missingKeyRule3: ['error', 'cool'],

	additionalKeyRule: false,
	additionalKeyRule1: 'warning',
	additionalKeyRule2: ['error'],
	additionalKeyRule3: ['error', { test: true }],
	// @ts-expect-error
	additionalKeyRule4: ['error', { test: 'uncool' }],
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
			standardRules(),
			missingKeyRule('warning'),
			additionalKeyRule(true),
		],
	}
} satisfies Config

test("debug code", async () => {
	const result = await lint(dummyConfig, dummyEnv)
	debug(result)
})
