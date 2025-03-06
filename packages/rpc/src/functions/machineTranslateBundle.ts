import {
	Text,
	VariableReference,
	type Variant,
	type BundleNested,
	type NewBundleNested,
} from "@inlang/sdk";
import { randomUUID } from "node:crypto";
import type { Result } from "../types.js";

export async function machineTranslateBundle(args: {
	bundle: BundleNested;
	sourceLocale: string;
	targetLocales: string[];
}): Promise<Result<NewBundleNested, string>> {
	try {
		if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
			return { error: "GOOGLE_TRANSLATE_API_KEY is not set" };
		}

		const copy = structuredClone(args.bundle);

		const sourceMessage = copy.messages.find(
			(m) => m.locale === args.sourceLocale
		);

		if (!sourceMessage) {
			return { error: "Source locale not found in the bundle" };
		}

		for (const sourceVariant of sourceMessage.variants) {
			const sourcePattern = serializePattern(sourceVariant.pattern, {});

			for (const targetLocale of args.targetLocales) {
				// if by mistake the source locale is in the target locales, skip it
				if (targetLocale === args.sourceLocale) {
					continue;
				}

				// Find target message for this locale if it exists
				const targetMessage = copy.messages.find(
					(m) => m.locale === targetLocale
				);

				// If target message exists, check if this variant already exists
				if (targetMessage) {
					// Check if a matching variant already exists
					const existingVariant = findMatchingVariant(
						targetMessage.variants,
						sourceVariant.matches
					);

					// Skip translation if matching variant already exists
					if (existingVariant) {
						continue;
					}
				}

				const response = await fetch(
					"https://translation.googleapis.com/language/translate/v2?" +
						new URLSearchParams({
							q: sourcePattern,
							target: targetLocale,
							source: args.sourceLocale,
							format: "html",
							key: process.env.GOOGLE_TRANSLATE_API_KEY,
						}),
					{ method: "POST" }
				);

				if (!response.ok) {
					const err = `${response.status} ${response.statusText}: translating from ${args.sourceLocale} to ${targetLocale}`;
					return { error: err };
				}

				const json = await response.json();
				const pattern = deserializePattern(
					json.data.translations[0].translatedText
				);

				if (targetMessage) {
					targetMessage.variants.push({
						id: randomUUID(),
						messageId: targetMessage.id,
						matches: sourceVariant.matches,
						pattern,
					} satisfies Variant);
				} else {
					const newMessageId = randomUUID();
					copy.messages.push({
						...sourceMessage,
						id: newMessageId,
						locale: targetLocale,
						variants: [
							{
								id: randomUUID(),
								messageId: newMessageId,
								matches: sourceVariant.matches,
								pattern,
							} satisfies Variant,
						],
					});
				}
			}
		}
		return { data: copy };
	} catch (error) {
		return { error: error?.toString() ?? "unknown error" };
	}
}

/**
 * Determines if a variant with matching "matches" property already exists
 * @param variants Array of variants to search through
 * @param matches The matches to look for
 * @returns The matching variant or undefined if no match found
 */
function findMatchingVariant(
	variants: Variant[],
	matches: Variant["matches"]
): Variant | undefined {
	// If matches is empty, look for variants with empty matches
	if (matches.length === 0) {
		return variants.find((v) => v.matches.length === 0);
	}

	// Otherwise, look for variants where all matches are equivalent
	return variants.find((variant) => {
		// If lengths don't match, it's not the same
		if (variant.matches.length !== matches.length) {
			return false;
		}

		// Check if all matches are equivalent
		return matches.every((sourceMatch) => {
			return variant.matches.some((targetMatch) => {
				// Both matches must have the same key and type
				if (
					targetMatch.key !== sourceMatch.key ||
					targetMatch.type !== sourceMatch.type
				) {
					return false;
				}

				// For literal matches, also check the value
				if (
					sourceMatch.type === "literal-match" &&
					targetMatch.type === "literal-match"
				) {
					return sourceMatch.value === targetMatch.value;
				}

				// For catchall matches, just matching key and type is sufficient
				return true;
			});
		});
	});
}

// MOCK_TRANSLATE: Mock the google translate api
const mockTranslate = !!process.env.MOCK_TRANSLATE;

// MOCK_TRANSLATE_ERRORS: 0 = no errors (default), 1 = all errors, n > 1 = 1/n fraction of errors
const mockErrors = Math.ceil(Number(process.env.MOCK_TRANSLATE_ERRORS)) || 0;

// MOCK_TRANSLATE_LATENCY in ms (default 0)
const mockLatency = Number(process.env.MOCK_TRANSLATE_LATENCY) || 0;

if (mockTranslate) {
	const errors =
		mockErrors === 0 ? "no" : mockErrors === 1 ? "all" : `1/${mockErrors}`;
	// eslint-disable-next-line no-console
	console.log(
		`🥸 Mocking machine translate api with ${errors} errors, ${mockLatency}ms latency`
	);
}

// Keep track of the number mock of calls, so we can simulate errors
let mockCount = 0;

/**
 * Mock the google translate api with a delay.
 * Enable by setting MOCK_TRANSLATE to true.
 *
 * Optionally set
 * - MOCK_TRANSLATE_LATENCY to simulate latency: default=0 (ms),
 * - MOCK_TRANSLATE_ERRORS to simulate errors: default=0.
 *   - 0: no errors
 *   - 1: only errors
 *   - n > 1: 1/n fraction of errors
 */
async function mockTranslateApi(
	q: string,
	sourceLanguageTag: string,
	targetLanguageTag: string
): Promise<{ translation: string; error?: string }> {
	mockCount++;
	const error = mockCount % mockErrors === 0 ? "Mock error" : undefined;
	const prefix = `Mock translate ${sourceLanguageTag} to ${targetLanguageTag}: `;
	// eslint-disable-next-line no-console
	// console.log(`${error ? "💥 Error " : ""}${prefix}${q.length > 50 ? q.slice(0, 50) + "..." : q}`)
	await new Promise((resolve) => setTimeout(resolve, mockLatency));
	return {
		translation: prefix + q,
		error,
	};
}

/**
 * Thanks to https://issuetracker.google.com/issues/119256504?pli=1 this crap is required.
 *
 * Storing the placeholdermetadata externally to be uneffected by the api.
 */
type PlaceholderMetadata = Record<
	string,
	{
		leadingCharacter?: string;
		trailingCharacter?: string;
	}
>;

// class="notranslate" tells the google api to not translate the innner element
const escapeStart = `<span class="notranslate">`;
const escapeEnd = "</span>";

function serializePattern(
	pattern: Variant["pattern"],
	placeholderMetadata: PlaceholderMetadata
) {
	let result = "";
	for (const [i, element] of pattern.entries()) {
		if (element.type === "text") {
			// google translate api doesn't like carrigage returns and line feeds in html format,
			// so we replace them with placeholders and replace them back after translation
			result += element.value
				.replaceAll("\r", "<inlang-CarriageReturn>")
				.replaceAll("\n", "<inlang-LineFeed>");
		} else {
			// ugliest code ever thanks to https://issuetracker.google.com/issues/119256504?pli=1
			//   1. escape placeholders
			//   2. store leading and trailing character of the placeholder
			//      (using cL and cT to save translation costs that are based on characters)
			// TODO: handle placeholder with correct type
			// @ts-expect-error
			placeholderMetadata[element.name] = {
				leadingCharacter: result.at(-1) ?? undefined,
				trailingCharacter:
					pattern[i + 1]?.type === "text"
						? (pattern[i + 1] as Text).value[0]
						: undefined,
			};
			result += `${escapeStart}${JSON.stringify(element)}${escapeEnd}`;
		}
	}
	return result;
}

function deserializePattern(text: string): Variant["pattern"] {
	const result: Variant["pattern"] = [];
	// google translate espaces quotes, need to replace the escaped stuff
	const unescapedText = text
		.replaceAll("&quot;", '"')
		.replaceAll("&#39;", "'")
		.replaceAll("<inlang-CarriageReturn>", "\r")
		.replaceAll("<inlang-LineFeed> ", "\n");
	let i = 0;
	while (i < unescapedText.length) {
		const start = unescapedText.indexOf(escapeStart, i);
		// no placeholders, immediately return text
		if (start === -1) {
			result.push({ type: "text", value: unescapedText.slice(i) });
			break;
		}
		// placeholder somewhere in the middle
		else if (i < start) {
			result.push({ type: "text", value: unescapedText.slice(i, start) });
			// move the index to the start of the placeholder and avoid pushing the same text element multiple times
			i = start;
			continue;
		}
		const end = unescapedText.indexOf(escapeEnd, start);
		if (end === -1) {
			result.push({ type: "text", value: unescapedText.slice(i) });
			break;
		}

		const expressionAsText = unescapedText.slice(
			start + escapeStart.length,
			end
		);
		const expression = JSON.parse(expressionAsText) as VariableReference;

		// can't get it running, ignoring for now
		// const lastElement = result[result.length]
		// if (
		// 	lastElement?.type === "Text" &&
		// 	lastElement.value.endsWith(placeholderMetadata[placeholder.name]!.leadingCharacter!) === false
		// ) {
		// 	// remove the latst, very likely hallucinated from the translate api, character
		// 	;(result[result.length] as Text).value = lastElement.value.slice(0, -2)
		// }
		// if (unescapedText[i + 1] !== placeholderMetadata[placeholder.name]!.trailingCharacter) {
		// 	i++
		// }

		// TODO: handle placeholder with correct type
		// @ts-expect-error
		result.push(expression);
		i = end + escapeEnd.length;
	}
	return result;
}
