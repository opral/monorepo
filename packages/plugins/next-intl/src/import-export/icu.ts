import {
	parse as parseIcu,
	TYPE,
	type MessageFormatElement,
} from "@formatjs/icu-messageformat-parser";
import { parse as parseMf1, type Token } from "@messageformat/parser";
import {
	escapeIcuText,
	parseMessage,
	serializeMessage,
	type ParsedMessage,
} from "@inlang/plugin-icu1";
import type { Bundle, Message, Pattern, Variant } from "@inlang/sdk";

/**
 * next-intl messages are ICU MessageFormat strings, read by `intl-messageformat`:
 * plurals, selects, selectordinals, `#`, number and date formats, and rich text
 * tags like `<b>…</b>`, which `t.rich()` and `t.markup()` render.
 *
 * The plugin reads them with the parser `intl-messageformat` uses, so a message
 * means in inlang what it means in next-intl, and converts them with the ICU1
 * plugin's mapping to inlang's selectors and variants. Tags become markup.
 *
 * The ICU1 conversion doesn't know tags, and its ICU dialect (ICU4J's, as read
 * by `@messageformat/parser`) differs from `intl-messageformat`'s in what an
 * apostrophe quotes: `'<b>'` is a literal `<b>` in next-intl. Between the two,
 * tags are noncharacters that neither dialect escapes.
 */

const OPEN = "\uFDD0";
const CLOSE = "\uFDD1";
// Not a regex literal: esbuild writes its characters as they are, and the
// published SDK loads plugins with `btoa`, which only takes Latin-1.
const PLACEHOLDER = new RegExp("\\uFDD0(\\d+)\\uFDD1");

const placeholder = (index: number) => `${OPEN}${index}${CLOSE}`;

type Markup = Extract<
	Pattern[number],
	{ type: "markup-start" | "markup-end" | "markup-standalone" }
>;

/**
 * Parses a next-intl message. Throws if it isn't valid ICU for next-intl.
 */
export function parseNextIntlMessage(args: {
	messageSource: string;
	bundleId: string;
	locale: string;
}): ParsedMessage {
	if (args.messageSource.includes(OPEN) || args.messageSource.includes(CLOSE)) {
		throw new Error("The message contains the noncharacters U+FDD0 or U+FDD1");
	}
	const markup: Markup[] = [];
	const icu1 = toIcu1(
		parseIcu(args.messageSource, { captureLocation: true }),
		args.messageSource,
		markup,
		false
	);
	const parsed = parseMessage({
		messageSource: icu1,
		bundleId: args.bundleId,
		locale: args.locale,
	});
	return {
		...parsed,
		variants: parsed.variants.map((variant) => ({
			...variant,
			pattern: withMarkup(variant.pattern ?? [], markup),
		})),
	};
}

/**
 * The message in ICU1 (as read by `@messageformat/parser`), with tags as
 * placeholders for `markup`.
 *
 * `inPlural`: inside a plural or selectordinal, also in a select nested in it,
 * where `@messageformat/parser` reads `#` as the number (`intl-messageformat`
 * only directly in the plural), so a literal "#" is quoted.
 */
function toIcu1(
	elements: MessageFormatElement[],
	source: string,
	markup: Markup[],
	inPlural: boolean
): string {
	let result = "";
	for (const element of elements) {
		switch (element.type) {
			case TYPE.literal:
				result += escapeIcuText(element.value, inPlural);
				break;
			case TYPE.argument:
				result += `{${element.value}}`;
				break;
			case TYPE.number:
			case TYPE.date:
			case TYPE.time:
				// the argument as written, e.g. `{price, number, ::currency/EUR}`
				result += source.slice(
					element.location!.start.offset,
					element.location!.end.offset
				);
				break;
			case TYPE.pound:
				result += "#";
				break;
			case TYPE.select:
				result += `{${element.value}, select, ${Object.entries(element.options)
					.map(
						([key, option]) =>
							`${key} {${toIcu1(option.value, source, markup, inPlural)}}`
					)
					.join(" ")}}`;
				break;
			case TYPE.plural:
				result += `{${element.value}, ${
					element.pluralType === "ordinal" ? "selectordinal" : "plural"
				}, ${element.offset ? `offset:${element.offset} ` : ""}${Object.entries(
					element.options
				)
					.map(
						([key, option]) =>
							`${key} {${toIcu1(option.value, source, markup, true)}}`
					)
					.join(" ")}}`;
				break;
			case TYPE.tag:
				result += placeholder(
					markup.push({ type: "markup-start", name: element.value }) - 1
				);
				result += toIcu1(element.children, source, markup, inPlural);
				result += placeholder(
					markup.push({ type: "markup-end", name: element.value }) - 1
				);
				break;
		}
	}
	return result;
}

/**
 * The pattern with the placeholders in its texts replaced by `markup`.
 *
 * Texts stay apart as the ICU1 conversion splits them (`{a, select, x {X}} y`
 * imports as the texts "X" and " y"): its export writes the text that all
 * variants end with after the select again.
 */
function withMarkup(pattern: Pattern, markup: Markup[]): Pattern {
	const result: Pattern = [];
	for (const part of pattern) {
		if (part.type !== "text") {
			result.push(part);
			continue;
		}
		for (const [index, piece] of part.value.split(PLACEHOLDER).entries()) {
			if (index % 2 === 1) {
				result.push({ ...markup[Number(piece)]! });
			} else if (piece !== "") {
				result.push({ type: "text", value: piece });
			}
		}
	}
	return result;
}

/**
 * Serializes a message as a next-intl (`intl-messageformat`) ICU string.
 * Throws if the result isn't valid for next-intl.
 */
export function serializeNextIntlMessage(args: {
	bundle: Bundle;
	message: Message;
	variants: Variant[];
}): string {
	const legacy = legacyMessage(args);
	if (legacy !== undefined) {
		return legacy;
	}
	// next-intl tags have no attributes: options of markup (e.g. imported
	// from another format) aren't written.
	// Every tag gets its own placeholder. The ICU1 serializer moves text that
	// all variants start or end with out of the plural; a placeholder that is
	// equal in all variants could move a start tag out while its end tag stays
	// in the cases.
	const tags: string[] = [];
	const variants = args.variants.map((variant) => ({
		...variant,
		matches: variant.matches ?? [],
		pattern: (variant.pattern ?? []).map((part) => {
			switch (part.type) {
				case "markup-start":
					return {
						type: "text",
						value: placeholder(tags.push(`<${part.name}>`) - 1),
					} as const;
				case "markup-end":
					return {
						type: "text",
						value: placeholder(tags.push(`</${part.name}>`) - 1),
					} as const;
				case "markup-standalone":
					// intl-messageformat reads `<br/>` as text
					return {
						type: "text",
						value: placeholder(tags.push(`<${part.name}></${part.name}>`) - 1),
					} as const;
				default:
					return part;
			}
		}),
	}));
	const icu1 = serializeMessage({
		bundle: { ...args.bundle, declarations: args.bundle.declarations ?? [] },
		message: { ...args.message, selectors: args.message.selectors ?? [] },
		variants,
	});
	const result = print(parseMf1(icu1, { strict: false }), tags, false);
	// throws if next-intl can't read it
	parseIcu(result);
	return result;
}

/**
 * An argument name next-intl can read: no whitespace and no ICU syntax
 * characters (`,`, `{`, `#`, `.`, …).
 */
const ARGUMENT_NAME = /^[^\p{White_Space}\p{Pattern_Syntax}]+$/u;

/**
 * A message as plugin versions before 2.3 imported it: the ICU syntax in
 * variable names, e.g. `{count, plural, one {# item} other {# items}}` as the
 * variables `count, plural, one {# item` and `# items` with texts between
 * them. Projects that stored such data (e.g. in a `.inlang` file) write it
 * as these versions did, which gives the text they imported.
 */
function legacyMessage(args: {
	message: Message;
	variants: Variant[];
}): string | undefined {
	const [variant] = args.variants;
	if (
		(args.message.selectors ?? []).length > 0 ||
		args.variants.length !== 1 ||
		(variant!.matches ?? []).length > 0
	) {
		return undefined;
	}
	let result = "";
	let isLegacy = false;
	for (const part of variant!.pattern ?? []) {
		if (part.type === "text") {
			result += part.value;
		} else if (
			part.type === "expression" &&
			part.arg.type === "variable-reference" &&
			part.annotation === undefined
		) {
			isLegacy ||= ARGUMENT_NAME.test(part.arg.name) === false;
			result += `{${part.arg.name}}`;
		} else {
			return undefined;
		}
	}
	return isLegacy ? result : undefined;
}

/**
 * Prints the tokens of `@messageformat/parser` in next-intl's ICU dialect.
 *
 * `inPlural`: directly in a plural or selectordinal, where `intl-messageformat`
 * reads `#` as the number.
 */
function print(tokens: Token[], tags: string[], inPlural: boolean): string {
	let result = "";
	let text = "";
	const flush = () => {
		const pieces = text.split(PLACEHOLDER);
		for (const [index, piece] of pieces.entries()) {
			result +=
				index % 2 === 1
					? tags[Number(piece)]!
					: escapeNextIntlText(piece, inPlural);
		}
		text = "";
	};
	for (const token of tokens) {
		if (token.type === "content") {
			text += token.value;
			continue;
		}
		flush();
		switch (token.type) {
			case "argument":
				result += `{${token.arg}}`;
				break;
			case "function":
				result += `{${token.arg}, ${token.key}${
					token.param
						? `,${token.param
								.map((param) => {
									if (param.type !== "content") {
										throw new Error(`Unsupported style of {${token.arg}}`);
									}
									return param.value;
								})
								.join("")}`
						: ""
				}}`;
				break;
			case "octothorpe":
				result += "#";
				break;
			case "select":
			case "plural":
			case "selectordinal":
				result += `{${token.arg}, ${token.type}, ${
					token.pluralOffset ? `offset:${token.pluralOffset} ` : ""
				}${sortCases(token.cases, token.type !== "select")
					.map(
						(selectCase) =>
							`${selectCase.key} {${print(
								selectCase.tokens,
								tags,
								token.type !== "select"
							)}}`
					)
					.join(" ")}}`;
				break;
		}
	}
	flush();
	return result;
}

const PLURAL_CATEGORIES = ["zero", "one", "two", "few", "many"];

/**
 * The cases in the order people write them: exact numbers (`=0`), the plural
 * categories from `zero` to `many`, then `other`. Editors store variants in
 * any order (e.g. a new `=0` after the others), and ICU selects a case
 * regardless of its position.
 */
function sortCases<Case extends { key: string }>(
	cases: Case[],
	isPlural: boolean
): Case[] {
	const rank = (key: string) => {
		if (key === "other") return [3, 0];
		if (!isPlural) return [1, 0];
		if (/^=\d+(\.\d+)?$/.test(key)) return [0, Number(key.slice(1))];
		const category = PLURAL_CATEGORIES.indexOf(key);
		return category === -1 ? [2, 0] : [1, category];
	};
	return [...cases].sort((a, b) => {
		const [groupA, orderA] = rank(a.key);
		const [groupB, orderB] = rank(b.key);
		return groupA! - groupB! || orderA! - orderB!;
	});
}

/**
 * Escapes literal text for `intl-messageformat`.
 *
 * `{`, `}`, a `<` that would start a tag, and directly in a plural `#` are
 * quoted, together with the apostrophes that follow them: ICU reads `''` in a
 * quote as an apostrophe that continues the quote. An apostrophe is doubled
 * where it would start a quote (before `'`, `{`, `}`, `<`, `>` or `#`, and at
 * the end, before the next argument or tag); elsewhere, like in "Don't", it's
 * literal as it is.
 */
export function escapeNextIntlText(text: string, inPlural: boolean): string {
	const isSpecial = (index: number) => {
		const char = text[index];
		return (
			char === "{" ||
			char === "}" ||
			(char === "#" && inPlural) ||
			(char === "<" && /[A-Za-z/]/.test(text[index + 1] ?? ""))
		);
	};
	let result = "";
	let index = 0;
	while (index < text.length) {
		if (isSpecial(index)) {
			// specials separated only by apostrophes are quoted as one segment
			let end = index + 1;
			for (;;) {
				let next = end;
				while (text[next] === "'") next++;
				if (next < text.length && isSpecial(next)) {
					end = next + 1;
				} else {
					end = next;
					break;
				}
			}
			result += `'${text.slice(index, end).replace(/'/g, "''")}'`;
			index = end;
		} else if (text[index] === "'") {
			const next = text[index + 1];
			result += next === undefined || "'{}<>#".includes(next) ? "''" : "'";
			index++;
		} else {
			result += text[index];
			index++;
		}
	}
	return result;
}
