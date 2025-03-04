/**
 * Bundled from inlang-v1.
 *
 * Exists to support inlang-v1 apps in machine translating.
 * See https://github.com/opral/inlang-cli/issues/29
 */


type Text = {
	type: "Text";
	value: string;
};

type LanguageTag = any;

type Message = any;

type VariableReference = any;

type Variant = any;

type SuccessResult<Data> = { data: Data; error?: never };

type ErrorResult<Error> = { data?: never; error: Error };

type Result<Data, Error> = SuccessResult<Data> | ErrorResult<Error>;

/**
 * @deprecated legacy v1 function. use `machineTranslateBundle` instead.
 */
export async function machineTranslateMessage(args: {
	message: Message;
	sourceLanguageTag: LanguageTag;
	targetLanguageTags: LanguageTag[];
}): // must return a string as en error because needs to be serializable
Promise<Result<Message, string>> {
	try {
		if (!process.env.GOOGLE_TRANSLATE_API_KEY) {
			throw new Error("GOOGLE_TRANSLATE_API_KEY is not set");
		}
		const copy = structuredClone(args.message);
		for (const targetLanguageTag of args.targetLanguageTags) {
			if (
				!args.sourceLanguageTag ||
				!args.message.variants.some(
					(variant: any) => variant.languageTag === args.sourceLanguageTag
				)
			) {
				throw new Error("Source language configuration missing");
			}
			for (const variant of args.message.variants.filter(
				(variant: any) => variant.languageTag === args.sourceLanguageTag
			)) {
				const targetVariant = getVariant(args.message, {
					where: {
						languageTag: targetLanguageTag,
						match: variant.match,
					},
				});
				if (targetVariant) {
					continue;
				}
				const placeholderMetadata: PlaceholderMetadata = {};
				const q = serializePattern(variant.pattern, placeholderMetadata);
				let translation: string;

				if (!process.env.MOCK_TRANSLATE) {
					const response = await fetch(
						"https://translation.googleapis.com/language/translate/v2?" +
							new URLSearchParams({
								q,
								target: targetLanguageTag,
								source: args.sourceLanguageTag,
								// html to escape placeholders
								format: "html",
								key: process.env.GOOGLE_TRANSLATE_API_KEY,
							}),
						{ method: "POST" }
					);
					if (!response.ok) {
						const err = `${response.status} ${response.statusText}: translating from ${args.sourceLanguageTag} to ${targetLanguageTag}`;
						return { error: err };
					}
					const json = await response.json();
					translation = json.data.translations[0].translatedText;
				} else {
					const mockTranslation = await mockTranslateApi(
						q,
						args.sourceLanguageTag,
						targetLanguageTag
					);
					if (mockTranslation.error) return { error: mockTranslation.error };
					translation = mockTranslation.translation;
				}
				copy.variants.push({
					languageTag: targetLanguageTag,
					match: variant.match,
					pattern: deserializePattern(translation),
				});
			}
		}
		return { data: copy };
	} catch (error) {
		console.error(error);
		return { error: error?.toString() ?? "unknown error" };
	}
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
	pattern: Message["variants"][number]["pattern"],
	placeholderMetadata: PlaceholderMetadata
) {
	let result = "";
	for (const [i, element] of pattern.entries()) {
		if (element.type === "Text") {
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
			placeholderMetadata[element.name] = {
				leadingCharacter: result.at(-1) ?? undefined,
				trailingCharacter:
					pattern[i + 1]?.type === "Text"
						? (pattern[i + 1] as Text).value[0]
						: undefined,
			};
			result += `${escapeStart}${JSON.stringify(element)}${escapeEnd}`;
		}
	}
	return result;
}

function deserializePattern(
	text: string
): Message["variants"][number]["pattern"] {
	const result: Message["variants"][number]["pattern"] = [];
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
			result.push({ type: "Text", value: unescapedText.slice(i) });
			break;
		}
		// placeholder somewhere in the middle
		else if (i < start) {
			result.push({ type: "Text", value: unescapedText.slice(i, start) });
			// move the index to the start of the placeholder and avoid pushing the same text element multiple times
			i = start;
			continue;
		}
		const end = unescapedText.indexOf(escapeEnd, start);
		if (end === -1) {
			result.push({ type: "Text", value: unescapedText.slice(i) });
			break;
		}

		const placeholderAsText = unescapedText.slice(
			start + escapeStart.length,
			end
		);
		const placeholder = JSON.parse(placeholderAsText) as VariableReference;

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

		result.push(placeholder);
		i = end + escapeEnd.length;
	}
	return result;
}

function getVariant(
	message: Message,
	args: {
		where: {
			languageTag: LanguageTag;
			match?: Variant["match"];
		};
	}
): Variant | undefined {
	const variant = matchMostSpecificVariant(
		message,
		args.where.languageTag,
		args.where.match
	);
	if (variant) {
		//! do not return a reference to the message in a resource
		//! modifications to the returned message will leak into the
		//! resource which is considered to be immutable.
		return structuredClone(variant);
	}
	return undefined;
}

/**
 * Returns the most specific variant of a message.
 *
 * @example
 *  const variant = matchMostSpecificVariant(message, languageTag: "en", selectors: { gender: "male" })
 */
const matchMostSpecificVariant = (
	message: Message,
	languageTag: LanguageTag,
	match?: Variant["match"]
): Variant | undefined => {
	// resolve preferenceSelectors to match length and order of message selectors
	const index: Record<string, any> = {};

	for (const variant of message.variants) {
		if (variant.languageTag !== languageTag) continue;

		let isMatch = true;

		// if slector and stored match are not the same throw error
		if (variant.match.length !== message.selectors.length) {
			return undefined;
		}

		//check if variant is a match
		if (variant.match.length > 0) {
			variant.match.map((value, index) => {
				if (match && match[index] !== value && value !== "*") {
					isMatch = false;
				}
			});
		}
		if (isMatch && match && match.length > 0) {
			// eslint-disable-next-line no-inner-declarations
			function recursiveAddToIndex(
				currentIndex: Record<string, any>,
				selectorIndex: number,
				selectorLength: number,
				variant: Variant
			) {
				const key = variant.match[selectorIndex];
				if (key) {
					if (selectorIndex === 1) {
						currentIndex[key] = variant;
					} else {
						if (!currentIndex[key]) {
							currentIndex[key] = {};
						}
						recursiveAddToIndex(
							currentIndex[key],
							selectorIndex + 1,
							selectorLength,
							variant
						);
					}
				}
			}
			recursiveAddToIndex(
				index,
				0,
				message.selectors ? message.selectors.length - 1 : 0,
				variant
			);
		} else if (isMatch && !match) {
			return variant;
		}
	}

	// if number of selectors and numver of required match is not the same match catch all
	if (
		!message.selectors ||
		!match ||
		match.length !== message.selectors.length
	) {
		const catchAllMatcher: Array<string> = [];
		const selectorCount = message.selectors.length;
		catchAllMatcher.push("*");
		for (let i = 0; i < selectorCount - 1; i++) {
			catchAllMatcher.push("*");
		}
		return message.variants.find(
			(v) =>
				v.languageTag === languageTag &&
				JSON.stringify(v.match) === JSON.stringify(catchAllMatcher)
		);
	}

	// if selector is empty match empty variant match
	if (message.selectors && message.selectors.length === 0) {
		return message.variants.find(
			(v) => v.languageTag === languageTag && JSON.stringify(v.match) === "[]"
		);
	}

	//find the most specific variant
	const findOptimalMatch = (
		index: Record<string, any>,
		selectors: string[]
	): Variant | undefined => {
		const keys = Object.keys(index);

		for (const key of keys) {
			if (key === selectors[0] || key === "*") {
				const nextOptimal = selectors.slice(1);

				if (nextOptimal.length === 0) {
					return (index[key] as Variant) || undefined;
				}

				const match = findOptimalMatch(
					index[key] as Record<string, any>,
					nextOptimal
				);

				if (match !== undefined) {
					return match;
				}
			}
		}
		return undefined;
	};

	return findOptimalMatch(index, match || []);
};
