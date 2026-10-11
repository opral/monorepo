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
import type {
	Bundle,
	Expression,
	Message,
	Pattern,
	Variant,
} from "@inlang/sdk";

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
const STYLE_OPEN = "\uFDD2";
const STYLE_CLOSE = "\uFDD3";
// Not regex literals: esbuild writes their characters as they are, and the
// published SDK loads plugins with `btoa`, which only takes Latin-1.
const PLACEHOLDER = new RegExp("\\uFDD0(\\d+)\\uFDD1");
const PLACEHOLDERS = new RegExp("\\uFDD0(\\d+)\\uFDD1", "g");
const STYLE_PLACEHOLDERS = new RegExp("\\uFDD2(\\d+)\\uFDD3", "g");
const NONCHARACTERS = new RegExp("[\\uFDD0-\\uFDD3]");

const placeholder = (index: number) => `${OPEN}${index}${CLOSE}`;
const stylePlaceholder = (index: number) =>
	`${STYLE_OPEN}${index}${STYLE_CLOSE}`;

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
	if (NONCHARACTERS.test(args.messageSource)) {
		throw new Error("The message contains the noncharacters U+FDD0-U+FDD3");
	}
	const markup: Markup[] = [];
	const styles: string[] = [];
	const icu1 = toIcu1(
		parseIcu(args.messageSource, { captureLocation: true }),
		{ source: args.messageSource, markup, styles },
		false
	);
	const parsed = parseMessage({
		messageSource: icu1,
		bundleId: args.bundleId,
		locale: args.locale,
	});
	const restore = (value: string) =>
		value.replace(STYLE_PLACEHOLDERS, (_, index) => styles[Number(index)]!);
	return {
		...parsed,
		declarations: parsed.declarations.map((declaration) =>
			declaration.type === "local-variable"
				? {
						...declaration,
						value: withStyles(declaration.value, restore),
					}
				: declaration
		),
		variants: parsed.variants.map((variant) => ({
			...variant,
			pattern: withMarkup(variant.pattern ?? [], markup).map((part) =>
				part.type === "expression" ? withStyles(part, restore) : part
			),
		})),
	};
}

/** The expression with `replace` applied to the `style` of its function. */
function withStyles<T extends Expression>(
	expression: T,
	replace: (style: string) => string
): T {
	const annotation = expression.annotation;
	if (annotation?.type !== "function-reference") return expression;
	return {
		...expression,
		annotation: {
			...annotation,
			options: annotation.options.map((option) =>
				option.name === "style" && option.value.type === "literal"
					? {
							...option,
							value: { ...option.value, value: replace(option.value.value) },
						}
					: option
			),
		},
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
	context: { source: string; markup: Markup[]; styles: string[] },
	inPlural: boolean
): string {
	const { markup, styles } = context;
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
			case TYPE.time: {
				// the style as written, e.g. `::currency/EUR` or `h 'o''clock'`:
				// the ICU1 conversion would escape its apostrophes
				const style = context.source
					.slice(element.location!.start.offset, element.location!.end.offset)
					.match(/^\{[^,]*,[^,]*,\s*([\s\S]*?)\s*\}$/)?.[1];
				const type = ["number", "date", "time"][element.type - TYPE.number];
				result +=
					style === undefined
						? `{${element.value}, ${type}}`
						: `{${element.value}, ${type}, ${stylePlaceholder(styles.push(style) - 1)}}`;
				break;
			}
			case TYPE.pound:
				result += "#";
				break;
			case TYPE.select:
				result += `{${element.value}, select, ${Object.entries(element.options)
					.map(
						([key, option]) =>
							`${key} {${toIcu1(option.value, context, inPlural)}}`
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
						([key, option]) => `${key} {${toIcu1(option.value, context, true)}}`
					)
					.join(" ")}}`;
				break;
			case TYPE.tag:
				result += placeholder(
					markup.push({ type: "markup-start", name: element.value }) - 1
				);
				result += toIcu1(element.children, context, inPlural);
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
	// Every tag gets its own placeholder, and so does the style of a format
	// (`h 'o''clock'`), which the ICU1 serializer would escape again. next-intl
	// tags have no attributes: options of markup (e.g. imported from another
	// format) aren't written.
	const tags: string[] = [];
	/** the placeholder of the end of each start tag, and the other way round */
	const partners: number[] = [];
	const styles: string[] = [];
	const variants = args.variants.map((variant) => {
		const open: number[] = [];
		return {
			...variant,
			matches: variant.matches ?? [],
			pattern: balanceMarkup(variant.pattern ?? []).map((part) => {
				switch (part.type) {
					case "markup-start": {
						const index = tags.push(`<${part.name}>`) - 1;
						open.push(index);
						return { type: "text", value: placeholder(index) } as const;
					}
					case "markup-end": {
						const index = tags.push(`</${part.name}>`) - 1;
						// balanceMarkup closes every tag in order
						const start = open.pop()!;
						partners[start] = index;
						partners[index] = start;
						return { type: "text", value: placeholder(index) } as const;
					}
					case "markup-standalone":
						// intl-messageformat reads `<br/>` as text
						return {
							type: "text",
							value: placeholder(
								tags.push(`<${part.name}></${part.name}>`) - 1
							),
						} as const;
					case "expression":
						return part.annotation?.type === "function-reference" &&
							part.annotation.name !== "icu:pound"
							? withStyles(part, (style) =>
									stylePlaceholder(styles.push(style) - 1)
								)
							: part;
					default:
						return part;
				}
			}),
		};
	});
	const icu1 = serializeMessage({
		bundle: { ...args.bundle, declarations: args.bundle.declarations ?? [] },
		message: { ...args.message, selectors: args.message.selectors ?? [] },
		variants,
	});
	const nodes = toNodes(parseMf1(icu1, { strict: false }), undefined);
	const result = print(withTagsInCases(nodes, partners), {
		tags,
		plural: undefined,
	}).replace(STYLE_PLACEHOLDERS, (_, index) => styles[Number(index)]!);
	// throws if next-intl can't read it
	parseIcu(result);
	return result;
}

/**
 * The pattern with markup that has no counterpart as text: next-intl can't
 * read a tag that isn't closed (e.g. after a translator deleted its end).
 */
function balanceMarkup(pattern: Pattern): Pattern {
	const result: Pattern = [...pattern];
	const asText = (index: number) => {
		const part = pattern[index] as Markup;
		result[index] = {
			type: "text",
			value: part.type === "markup-end" ? `</${part.name}>` : `<${part.name}>`,
		};
	};
	/** the indexes of the tags that are open */
	const open: number[] = [];
	for (const [index, part] of pattern.entries()) {
		if (part.type === "markup-start") {
			open.push(index);
		} else if (part.type === "markup-end") {
			let start = open.length - 1;
			while (
				start >= 0 &&
				(pattern[open[start]!] as Markup).name !== part.name
			) {
				start--;
			}
			if (start === -1) {
				asText(index);
				continue;
			}
			// tags opened inside it that are still open aren't closed
			for (const unclosed of open.splice(start + 1)) asText(unclosed);
			open.pop();
		}
	}
	for (const unclosed of open) asText(unclosed);
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

/** A message as `@messageformat/parser` reads it, with `#` resolved. */
type Node =
	| { type: "text"; value: string }
	| { type: "argument"; arg: string }
	| { type: "function"; arg: string; key: string; style?: string }
	/** `arg - offset`, written as `#` directly in its plural */
	| { type: "pound"; arg: string; offset: number }
	| {
			type: "select" | "plural" | "selectordinal";
			arg: string;
			offset: number;
			cases: Array<{ key: string; nodes: Node[] }>;
	  };

type Plural = { arg: string; offset: number };

/** `plural`: the plural or selectordinal that `#` refers to. */
function toNodes(tokens: Token[], plural: Plural | undefined): Node[] {
	return tokens.map((token): Node => {
		switch (token.type) {
			case "content":
				return { type: "text", value: token.value };
			case "argument":
				return { type: "argument", arg: token.arg };
			case "function":
				return {
					type: "function",
					arg: token.arg,
					key: token.key,
					style: token.param
						?.map((param) => {
							if (param.type !== "content") {
								throw new Error(`Unsupported style of {${token.arg}}`);
							}
							return param.value;
						})
						.join("")
						.trim(),
				};
			case "octothorpe":
				if (plural === undefined) return { type: "text", value: "#" };
				return { type: "pound", ...plural };
			default: {
				const own =
					token.type === "select"
						? plural
						: { arg: token.arg, offset: token.pluralOffset ?? 0 };
				return {
					type: token.type,
					arg: token.arg,
					offset: token.pluralOffset ?? 0,
					cases: token.cases.map((selectCase) => ({
						key: selectCase.key,
						nodes: toNodes(selectCase.tokens, own),
					})),
				};
			}
		}
	});
}

const isSelect = (node: Node) =>
	node.type === "select" ||
	node.type === "plural" ||
	node.type === "selectordinal";

/**
 * The nodes with every tag in the case of a plural or select that has its
 * counterpart.
 *
 * The ICU1 serializer writes the text that all variants share before and
 * after a plural outside of it, e.g. `<b>` of
 * `{n, plural, other {<b>#</b> of #}}`, while `</b>` stays in the case:
 * next-intl can't read a tag that ends in another case. Where that happens,
 * the nodes around the first plural or select go into each of its cases.
 */
function withTagsInCases(nodes: Node[], partners: number[]): Node[] {
	const index = nodes.findIndex(isSelect);
	if (index !== -1 && !hasBalancedTags(nodes, partners)) {
		const select = nodes[index] as Extract<Node, { cases: unknown }>;
		return withTagsInCases(
			[
				{
					...select,
					cases: select.cases.map((selectCase) => ({
						key: selectCase.key,
						nodes: [
							...nodes.slice(0, index),
							...selectCase.nodes,
							...nodes.slice(index + 1),
						],
					})),
				},
			],
			partners
		);
	}
	return nodes.map((node) =>
		"cases" in node
			? {
					...node,
					cases: node.cases.map((selectCase) => ({
						key: selectCase.key,
						nodes: withTagsInCases(selectCase.nodes, partners),
					})),
				}
			: node
	);
}

/**
 * Whether every tag in the texts of `nodes` (not in cases) has its
 * counterpart there too.
 */
function hasBalancedTags(nodes: Node[], partners: number[]): boolean {
	const here = new Set<number>();
	for (const node of nodes) {
		if (node.type !== "text") continue;
		for (const [, index] of node.value.matchAll(PLACEHOLDERS)) {
			here.add(Number(index));
		}
	}
	return [...here].every(
		(index) => partners[index] === undefined || here.has(partners[index]!)
	);
}

/**
 * Prints `nodes` in next-intl's ICU dialect.
 *
 * `plural`: the plural or selectordinal the nodes are directly in, where
 * `intl-messageformat` reads `#` as its number (in a select nested in it,
 * `#` is text).
 */
function print(
	nodes: Node[],
	context: { tags: string[]; plural: Plural | undefined }
): string {
	let result = "";
	let text = "";
	const flush = () => {
		const pieces = text.split(PLACEHOLDER);
		for (const [index, piece] of pieces.entries()) {
			result +=
				index % 2 === 1
					? context.tags[Number(piece)]!
					: escapeNextIntlText(piece, context.plural !== undefined);
		}
		text = "";
	};
	for (const node of nodes) {
		if (node.type === "text") {
			text += node.value;
			continue;
		}
		flush();
		switch (node.type) {
			case "argument":
				result += `{${node.arg}}`;
				break;
			case "function":
				result += `{${node.arg}, ${node.key}${
					node.style ? `, ${node.style}` : ""
				}}`;
				break;
			case "pound":
				result +=
					context.plural?.arg === node.arg &&
					context.plural.offset === node.offset
						? "#"
						: node.offset === 0
							? `{${node.arg}, number}`
							: `{${node.arg}, plural, offset:${node.offset} other {#}}`;
				break;
			default: {
				const plural =
					node.type === "select"
						? undefined
						: { arg: node.arg, offset: node.offset };
				const cases = sortCases(node.cases, node.type !== "select");
				// intl-messageformat requires `other`
				if (!cases.some((selectCase) => selectCase.key === "other")) {
					cases.push({ key: "other", nodes: [] });
				}
				result += `{${node.arg}, ${node.type}, ${
					node.offset ? `offset:${node.offset} ` : ""
				}${cases
					.map(
						(selectCase) =>
							`${selectCase.key} {${print(selectCase.nodes, {
								tags: context.tags,
								plural,
							})}}`
					)
					.join(" ")}}`;
				break;
			}
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
