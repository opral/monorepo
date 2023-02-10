import { test, vi } from "vitest";
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
