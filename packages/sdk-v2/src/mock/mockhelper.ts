import type { Declaration, Expression, LintReport, Pattern } from "../types/schema.js"
import type { BundleWithMessages, MessageWithVariants } from "../types/sdkTypes.js"

import { inputNames, inputsWithSelectors, simpleInputs, translations } from "./mockdata"
import { v4 } from "uuid"
import { randomHumanId } from "../human-id/human-readable-id.js"

export function generateUUID() {
	return v4()
}

/**
 *
 * @param variants
 * @returns an array of variants and there vorresponding matachers like [['one', 'one'], ['one', '*'],['*', 'one'], ['*', '*']]
 */
function generateCombinations(variants: string[][]): string[][] {
	const combinations: string[][] = []

	function backtrack(path: string[], index: number) {
		if (index === variants.length) {
			combinations.push([...path])
			return
		}

		for (const variant of variants[index]!) {
			path.push(variant)
			backtrack(path, index + 1)
			path.pop()
		}
	}

	backtrack([], 0)
	return combinations
}

/**
 * generates a message bundle with messages for the given locales and other properties passed as paramters
 * @param languageTags language tags to generate messages for
 * @param nInputs number of inputs to add number should be bigger or equal the number of selector for now
 * @param nSelectors number of selectors to add like plural forms or numbers
 * @param nExpressions number of expressens to add to the variant patterns (like name placeholders)
 */
export function createBundle(args: {
	languageTags: string[]
	nInputs: number
	nSelectors: number
	nExpressions: number
}) {
	const bundleId = randomHumanId()
	const bundleAlias = {
		// TODO generate more realistic message bundle name like login_button or welcome_message or learn_more_lix
		default: "name_" + randomHumanId(),
	}

	const selectors: any[] = []
	const inputs: any[] = []
	const matchers: string[][] = []

	// add selectors with selectors and matchers first
	for (let i = 0; i < args.nSelectors; i++) {
		if (i === 0) {
			selectors.push(inputsWithSelectors.gender("gender").selector)
			inputs.push(inputsWithSelectors.gender("gender").inputDeclaration)
			matchers.push(inputsWithSelectors.gender("gender").matcher)
		} else {
			const inputName: string = inputNames[i]
			selectors.push(inputsWithSelectors.number(inputName).selector)
			inputs.push(inputsWithSelectors.number(inputName).inputDeclaration)
			matchers.push(inputsWithSelectors.number(inputName).matcher)
		}
	}

	// fill up the remaining inputs with simple inputs (no selector function and matchers)
	for (let i = inputs.length; i < args.nInputs; i++) {
		const inputName: string = inputNames[i] // TODO generate a selector name
		if (i === 0) {
			inputs.push(simpleInputs.string(inputName).inputDeclaration)
		} else {
			inputs.push(simpleInputs.string(inputName).inputDeclaration)
		}
	}

	const messages = createMessages(
		bundleId,
		args.languageTags,
		inputs,
		selectors,
		generateCombinations(matchers),
		args.nExpressions
	)
	return {
		id: bundleId,
		alias: bundleAlias,
		messages: messages,
	} as BundleWithMessages
}

function createMessages(
	bundleId: string,
	languageTags: string[],
	inputs: Declaration[],
	selectors: Expression[],
	variants: string[][],
	nExpressions: number
) {
	const messagesByLanguage: Record<string, MessageWithVariants> = {}

	for (const lanugageTag of languageTags) {
		const messageId = generateUUID()
		messagesByLanguage[lanugageTag] = {
			id: messageId,
			bundleId: bundleId,
			locale: lanugageTag, // cycling through 10 locales
			declarations: inputs,
			selectors: selectors,
			variants: [],
		}
	}

	for (const variant of variants) {
		const patternsByLanguage = createPattern(inputs, languageTags)
		for (const lanugageTag of languageTags) {
			messagesByLanguage[lanugageTag].variants.push({
				id: generateUUID(),
				match: variant,
				messageId: messagesByLanguage[lanugageTag].id,
				pattern: patternsByLanguage[lanugageTag],
			})
		}
	}

	return Object.values(messagesByLanguage)
}

function createPattern(inputs: Declaration[], languageTags: string[]) {
	const patterns: {
		[languageTag: string]: Pattern
	} = {}
	for (const lanugageTag of languageTags) {
		patterns[lanugageTag] = []
	}

	const textIndex = Math.floor(Math.random() * translations["en-US"].length)
	for (const lanugageTag of languageTags) {
		patterns[lanugageTag].push({ type: "text", value: translations[lanugageTag][textIndex] })
	}

	for (const input of inputs) {
		const textIndex = Math.floor(Math.random() * translations["en-US"].length)
		for (const lanugageTag of languageTags) {
			patterns[lanugageTag].push({ type: "text", value: translations[lanugageTag][textIndex] })
		}

		for (const lanugageTag of languageTags) {
			patterns[lanugageTag].push({
				type: "expression",
				arg: { type: "variable", name: input.name },
			})
		}
	}

	return patterns
}

export function mockReports(messageBundle: ReturnType<typeof createBundle>) {
	const lintReports: LintReport[] = []
	lintReports.push({
		ruleId: "uniqueAlias",
		target: {
			messageBundleId: messageBundle.id,
			messageId: undefined,
			variantId: undefined,
		},
		level: "error",
		body: "This Rule triggers because the alias is not unique",
		fixes: [
			{
				key: "toUpper",
				title: "Regenerate the alias",
			},
		],
	})

	for (const message of messageBundle.messages) {
		lintReports.push({
			ruleId: "outdatedTranslation",
			target: {
				messageBundleId: messageBundle.id,
				messageId: message.id,
				variantId: undefined,
			},
			level: "error",
			body: "This Messsage is outdated",
			fixes: [
				{
					key: "toUpper",
					title: "Convert to upper case",
				},
			],
		})

		for (const variant of message.variants) {
			lintReports.push({
				ruleId: "opralLowerCase",
				target: {
					messageBundleId: messageBundle.id,
					messageId: message.id,
					variantId: variant.id,
				},
				level: "error",
				body: "This Rule triggers because the text contains a lowerCase Opral",
				fixes: [
					{
						key: "toUpper",
						title: "Convert to upper case",
					},
				],
			})
		}
	}
	return lintReports
}
