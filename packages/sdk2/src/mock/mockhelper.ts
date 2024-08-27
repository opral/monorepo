/* eslint-disable @typescript-eslint/no-non-null-assertion */
import type { Declaration, Expression, Pattern } from "../schema/schemaV2.js";
import { generateBundleId } from "../bundle-id/bundle-id.js";
import {
	inputNames,
	inputsWithSelectors,
	simpleInputs,
	translations,
} from "./mockdata.js";
//@ts-ignore
import { v4 } from "uuid";
import type { BundleNested, MessageNested } from "../database/schema.js";

export function generateUUID() {
	return v4();
}

/**
 *
 * @param variants
 * @returns an array of variants and there vorresponding matachers like [['one', 'one'], ['one', '*'],['*', 'one'], ['*', '*']]
 */
function generateCombinations(
	variants: string[][],
	selector: string[]
): Record<string, string>[] {
	const combinations: Record<string, string>[] = [];

	function backtrack(path: Record<string, string>, index: number) {
		if (index === variants.length) {
			combinations.push(path);
			return;
		}

		for (const variant of variants[index]!) {
			path[selector[index]!] = variant;
			backtrack(path, index + 1);
			delete path[selector[index]!];
		}
	}

	backtrack({}, 0);
	return combinations;
}

/**
 * generates a message bundle with messages for the given locales and other properties passed as paramters
 * @param languageTags language tags to generate messages for
 * @param nInputs number of inputs to add number should be bigger or equal the number of selector for now
 * @param nSelectors number of selectors to add like plural forms or numbers
 * @param nExpressions number of expressens to add to the variant patterns (like name placeholders)
 */
export function createMockBundle(args: {
	languageTags: string[];
	nInputs: number;
	nSelectors: number;
	nExpressions: number;
}) {
	const bundleId = generateBundleId();
	const bundleAlias = {
		// TODO generate more realistic message bundle name like login_button or welcome_message or learn_more_lix
		default: "name_" + generateBundleId(),
	};

	const selectors: any[] = [];
	const inputs: any[] = [];
	const matchers: string[][] = [];

	// add selectors with selectors and matchers first
	for (let i = 0; i < args.nSelectors; i++) {
		if (i === 0) {
			selectors.push(inputsWithSelectors.gender("gender").selector);
			inputs.push(inputsWithSelectors.gender("gender").inputDeclaration);
			matchers.push(inputsWithSelectors.gender("gender").matcher);
		} else {
			const inputName: string = inputNames[i]!;
			selectors.push(inputsWithSelectors.number(inputName).selector);
			inputs.push(inputsWithSelectors.number(inputName).inputDeclaration);
			matchers.push(inputsWithSelectors.number(inputName).matcher);
		}
	}

	// fill up the remaining inputs with simple inputs (no selector function and matchers)
	for (let i = inputs.length; i < args.nInputs; i++) {
		const inputName: string = inputNames[i]!; // TODO generate a selector name
		if (i === 0) {
			inputs.push(simpleInputs.string(inputName).inputDeclaration);
		} else {
			inputs.push(simpleInputs.string(inputName).inputDeclaration);
		}
	}

	const messages = createMessages(
		bundleId,
		args.languageTags,
		inputs,
		selectors,
		generateCombinations(matchers, selectors)
	);
	return {
		id: bundleId,
		alias: bundleAlias,
		messages: messages,
	} as BundleNested;
}

function createMessages(
	bundleId: string,
	languageTags: string[],
	inputs: Declaration[],
	selectors: Expression[],
	variants: Array<Record<Expression["arg"]["name"], string>>
) {
	const messagesByLanguage: Record<string, MessageNested> = {};

	for (const lanugageTag of languageTags) {
		const messageId = generateUUID();
		messagesByLanguage[lanugageTag] = {
			id: messageId,
			bundleId: bundleId,
			locale: lanugageTag, // cycling through 10 locales
			declarations: inputs,
			selectors: selectors,
			variants: [],
		};
	}

	for (const variant of variants) {
		const y = messagesByLanguage["en"]!;

		y;
		const patternsByLanguage = createPattern(inputs, languageTags);
		for (const lanugageTag of languageTags) {
			messagesByLanguage[lanugageTag]!.variants.push({
				id: generateUUID(),
				match: variant,
				messageId: messagesByLanguage[lanugageTag]!.id,
				pattern: patternsByLanguage[lanugageTag]!,
			});
		}
	}

	return Object.values(messagesByLanguage);
}

function createPattern(inputs: Declaration[], languageTags: string[]) {
	const patterns: {
		[languageTag: string]: Pattern;
	} = {};
	for (const lanugageTag of languageTags) {
		patterns[lanugageTag] = [];
	}

	const textIndex = Math.floor(Math.random() * translations["en-US"]!.length);
	for (const lanugageTag of languageTags) {
		patterns[lanugageTag]!.push({
			type: "text",
			value: translations[lanugageTag]![textIndex]!,
		});
	}

	for (const input of inputs) {
		const textIndex = Math.floor(Math.random() * translations["en-US"]!.length);
		for (const lanugageTag of languageTags) {
			patterns[lanugageTag]!.push({
				type: "text",
				value: translations[lanugageTag]![textIndex]!,
			});
		}

		for (const lanugageTag of languageTags) {
			patterns[lanugageTag]!.push({
				type: "expression",
				arg: { type: "variable", name: input.name },
			});
		}
	}

	return patterns;
}
