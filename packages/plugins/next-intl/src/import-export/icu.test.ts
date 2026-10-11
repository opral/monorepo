import { describe, expect, test } from "vitest";
import { IntlMessageFormat } from "intl-messageformat";
import { parse, TYPE } from "@formatjs/icu-messageformat-parser";
import { importFiles } from "./importFiles.js";
import { exportFiles } from "./exportFiles.js";
import { escapeNextIntlText } from "./icu.js";

/**
 * next-intl messages are ICU MessageFormat, rendered by intl-messageformat.
 * The plugin must read them as next-intl does and write messages that
 * next-intl renders as the inlang message says.
 */

type Imported = Awaited<ReturnType<typeof importFiles>>;

async function importJson(json: Record<string, unknown>, locale = "en") {
	const imported = await importFiles({
		settings: {} as any,
		files: [
			{ locale, content: new TextEncoder().encode(JSON.stringify(json)) },
		],
	});
	return withIds(imported);
}

/** Rows with ids, as the SDK stores them. */
function withIds(imported: Imported) {
	const messages = imported.messages.map((message, index) => ({
		...message,
		id: message.id ?? `message-${index}`,
		selectors: message.selectors ?? [],
	}));
	const variants = imported.variants.map((variant, index) => ({
		...variant,
		id: `variant-${index}`,
		messageId: messages.find(
			(message) =>
				message.bundleId === variant.messageBundleId &&
				message.locale === variant.messageLocale
		)!.id,
		matches: variant.matches ?? [],
		pattern: variant.pattern ?? [],
	}));
	return { bundles: imported.bundles, messages, variants };
}

async function exportJson(
	rows: ReturnType<typeof withIds>,
	locale = "en"
): Promise<Record<string, any>> {
	const files = await exportFiles({ settings: {} as any, ...rows } as any);
	return JSON.parse(
		new TextDecoder().decode(
			files.find((file) => file.locale === locale)!.content
		)
	);
}

/** Renders a message like next-intl, with every tag as `[tag:…]`. */
function render(message: string, values: Record<string, unknown>) {
	const tags = Object.fromEntries(
		["b", "i", "link", "p", "br", "strong"].map((tag) => [
			tag,
			(chunks: unknown[]) => `[${tag}:${chunks.join("")}]`,
		])
	);
	const result = new IntlMessageFormat(message, "en").format({
		...tags,
		...values,
	} as any);
	return Array.isArray(result) ? result.join("") : String(result);
}

const valueSets: Array<Record<string, unknown>> = [];
for (const count of [0, 1, 2, 5, 21]) {
	for (const gender of ["female", "male", "other"]) {
		for (const place of [1, 2, 3, 11]) {
			valueSets.push({
				count,
				gender,
				place,
				name: "Ada",
				host: "Bo",
				price: 12.5,
				due: new Date(Date.UTC(2026, 9, 11, 12)),
			});
		}
	}
}

const messages: Record<string, string> = {
	text: "Hello {name}!",
	plural:
		"{count, plural, =0 {Your cart is empty} one {You have # item} other {You have # items}}",
	pluralInText:
		"You have {count, plural, one {<b>#</b> message} other {<b>#</b> messages}}.",
	select: "{gender, select, female {She} male {He} other {They}} liked it",
	selectordinal:
		"You came {place, selectordinal, one {#st} two {#nd} few {#rd} other {#th}}",
	tags: "Please <link>log in</link> or <b>{name}</b>.",
	tagAroundPlural: "<b>{count, plural, one {#} other {many}}</b> new",
	nestedTags: "<p>Read <b><i>this</i></b> first</p>",
	emptyTag: "Line<br></br>break",
	quoted: "Write '{name}' and '<b>' literally, it''s fine",
	apostrophe: "Don't stop, it's '' fine",
	angles: "A < B and C > D, 1 <2",
	number: "Total: {price, number, ::currency/EUR}",
	dates: "Due {due, date, short} at {due, time, short}",
	nested:
		"{gender, select, female {{count, plural, one {She has one} other {She has #}}} other {{count, plural, one {They have one} other {They have #}}}}",
	offset:
		"{count, plural, offset:1 =0 {nobody} =1 {just {host}} one {{host} and # other} other {{host} and # others}}",
	hashes: "#1 {count, plural, one {'#'1 is #} other {# is not '#'1}}",
	braces: "{count, plural, one {# '{'item'}'} other {# '{'items'}'}}",
};

describe("import", () => {
	test("ICU plurals, selects and selectordinals become selectors and variants, `#` the number", async () => {
		const rows = await importJson({
			Home: {
				cart: messages.plural,
				liked: messages.select,
				place: messages.selectordinal,
			},
		});
		const cart = rows.bundles.find((bundle) => bundle.id === "Home.cart")!;
		// the arguments, not the ICU syntax, are the variables
		expect(
			cart
				.declarations!.filter(
					(declaration) => declaration.type === "input-variable"
				)
				.map((declaration) => declaration.name)
		).toEqual(["count"]);
		const message = rows.messages.find(
			(message) => message.bundleId === "Home.cart"
		)!;
		expect(message.selectors.map((selector) => selector.name)).toEqual([
			"countPluralExact",
			"countPlural",
		]);
		const variants = rows.variants.filter(
			(variant) => variant.messageId === message.id
		);
		expect(
			variants.map((variant) => [
				variant.matches.map((match) =>
					match.type === "literal-match" ? match.value : "*"
				),
				variant.pattern,
			])
		).toEqual([
			[["0", "*"], [{ type: "text", value: "Your cart is empty" }]],
			[
				["*", "one"],
				[
					{ type: "text", value: "You have " },
					{
						type: "expression",
						arg: { type: "variable-reference", name: "count" },
						annotation: {
							type: "function-reference",
							name: "icu:pound",
							options: [],
						},
					},
					{ type: "text", value: " item" },
				],
			],
			[
				["*", "*"],
				[
					{ type: "text", value: "You have " },
					{
						type: "expression",
						arg: { type: "variable-reference", name: "count" },
						annotation: {
							type: "function-reference",
							name: "icu:pound",
							options: [],
						},
					},
					{ type: "text", value: " items" },
				],
			],
		]);

		const liked = rows.messages.find(
			(message) => message.bundleId === "Home.liked"
		)!;
		expect(liked.selectors.map((selector) => selector.name)).toEqual([
			"gender",
		]);
		const place = rows.messages.find(
			(message) => message.bundleId === "Home.place"
		)!;
		expect(place.selectors.map((selector) => selector.name)).toEqual([
			"placeOrdinal",
		]);
	});

	test("rich text tags become markup, also around and inside a plural", async () => {
		const rows = await importJson({
			tags: messages.tags,
			tagAroundPlural: messages.tagAroundPlural,
		});
		const patterns = (bundleId: string) =>
			rows.variants
				.filter((variant) => variant.messageBundleId === bundleId)
				.map((variant) => variant.pattern);
		expect(patterns("tags")).toEqual([
			[
				{ type: "text", value: "Please " },
				{ type: "markup-start", name: "link" },
				{ type: "text", value: "log in" },
				{ type: "markup-end", name: "link" },
				{ type: "text", value: " or " },
				{ type: "markup-start", name: "b" },
				{
					type: "expression",
					arg: { type: "variable-reference", name: "name" },
				},
				{ type: "markup-end", name: "b" },
				{ type: "text", value: "." },
			],
		]);
		expect(patterns("tagAroundPlural")).toEqual([
			[
				{ type: "markup-start", name: "b" },
				expect.objectContaining({ type: "expression" }),
				{ type: "markup-end", name: "b" },
				{ type: "text", value: " new" },
			],
			[
				{ type: "markup-start", name: "b" },
				{ type: "text", value: "many" },
				{ type: "markup-end", name: "b" },
				{ type: "text", value: " new" },
			],
		]);
	});

	test("quoted ICU is text, as next-intl displays it", async () => {
		const rows = await importJson({
			quoted: messages.quoted,
			apostrophe: messages.apostrophe,
		});
		expect(rows.bundles.flatMap((bundle) => bundle.declarations)).toEqual([]);
		expect(rows.variants.map((variant) => variant.pattern)).toEqual([
			[{ type: "text", value: "Write {name} and <b> literally, it's fine" }],
			[{ type: "text", value: "Don't stop, it's ' fine" }],
		]);
	});

	test("a message that isn't valid ICU is text, and keeps its text", async () => {
		const files = {
			"./messages/en.json": JSON.stringify(
				{ broken: "Mail <me@example.com> {oops", ok: "Fine" },
				undefined,
				2
			),
		};
		const settings = {
			baseLocale: "en",
			locales: ["en"],
			"plugin.inlang.nextIntl": { pathPattern: "./messages/{locale}.json" },
		} as any;
		const imported = withIds(
			await importFiles({
				settings,
				files: [
					{
						locale: "en",
						content: new TextEncoder().encode(files["./messages/en.json"]),
					},
				],
			})
		);
		expect(
			imported.variants.find((variant) => variant.messageBundleId === "broken")!
				.pattern
		).toEqual([{ type: "text", value: "Mail <me@example.com> {oops" }]);
		const exported = await exportFiles({
			settings,
			...imported,
			files: [
				{
					locale: "en",
					path: "./messages/en.json",
					content: new TextEncoder().encode(files["./messages/en.json"]),
				},
			],
		} as any);
		expect(new TextDecoder().decode(exported[0]!.content)).toBe(
			files["./messages/en.json"]
		);
	});

	test("a custom variableReferencePattern keeps reading messages as text with variables", async () => {
		const imported = await importFiles({
			settings: {
				"plugin.inlang.nextIntl": {
					pathPattern: "./{locale}.json",
					variableReferencePattern: ["{{", "}}"],
				},
			} as any,
			files: [
				{
					locale: "en",
					content: new TextEncoder().encode(
						JSON.stringify({ a: "Hi {{name}}, {count, plural, other {#}}" })
					),
				},
			],
		});
		expect(imported.variants[0]!.pattern).toEqual([
			{ type: "text", value: "Hi " },
			{
				type: "expression",
				arg: { type: "variable-reference", name: "name" },
			},
			{ type: "text", value: ", {count, plural, other {#}}" },
		]);
	});
});

describe("export", () => {
	test("next-intl renders every exported message as the file did", async () => {
		const rows = await importJson(messages);
		const exported = await exportJson(rows);
		expect(Object.keys(exported)).toEqual(Object.keys(messages));
		for (const [key, message] of Object.entries(messages)) {
			for (const values of valueSets) {
				expect(render(exported[key], values), `${key}: ${exported[key]}`).toBe(
					render(message, values)
				);
			}
		}
		// written as they were, except for the spelling of quotes and tags
		// around a plural, which go into each case
		expect(exported).toEqual({
			...messages,
			quoted: "Write '{'name'}' and '<'b> literally, it's fine",
			apostrophe: "Don't stop, it's ' fine",
			tagAroundPlural:
				"{count, plural, one {<b>#</b>} other {<b>many</b>}} new",
		});
	});

	test("edited plural forms, an added =0 and edited rich text", async () => {
		const rows = await importJson({
			unread:
				"{count, plural, one {<b>#</b> unread message} other {<b>#</b> unread messages}}",
			terms: "Read the <b>terms</b> and our <link>privacy policy</link>.",
		});
		// the "one" form
		const one = rows.variants.find((variant) =>
			variant.matches.some(
				(match) => match.type === "literal-match" && match.value === "one"
			)
		)!;
		one.pattern = [{ type: "text", value: "Exactly " }, ...one.pattern];
		// an exact =0, like an editor adds it
		const bundle = rows.bundles.find((bundle) => bundle.id === "unread")!;
		bundle.declarations!.push({
			type: "local-variable",
			name: "countPluralExact",
			value: {
				type: "expression",
				arg: { type: "variable-reference", name: "count" },
			},
		});
		const message = rows.messages.find(
			(message) => message.bundleId === "unread"
		)!;
		message.selectors.unshift({
			type: "variable-reference",
			name: "countPluralExact",
		});
		for (const variant of rows.variants) {
			if (variant.messageId === message.id) {
				variant.matches.unshift({
					type: "catchall-match",
					key: "countPluralExact",
				});
			}
		}
		rows.variants.push({
			...one,
			id: "zero",
			matches: [
				{ type: "literal-match", key: "countPluralExact", value: "0" },
				{ type: "catchall-match", key: "countPlural" },
			],
			pattern: [{ type: "text", value: "No unread messages" }],
		});
		// the text of the link
		const terms = rows.variants.find(
			(variant) => variant.messageBundleId === "terms"
		)!;
		expect(terms.pattern[6]).toEqual({ type: "text", value: "privacy policy" });
		terms.pattern[6] = { type: "text", value: "privacy notice" };

		expect(await exportJson(rows)).toEqual({
			unread:
				"{count, plural, =0 {No unread messages} one {Exactly <b>#</b> unread message} other {<b>#</b> unread messages}}",
			terms: "Read the <b>terms</b> and our <link>privacy notice</link>.",
		});
	});

	test("cases are written in the usual order, whatever the order of the variants", async () => {
		const rows = await importJson({
			cart: "{count, plural, other {# items} =0 {none} one {# item}}",
			pronoun: "{gender, select, other {they} male {he} female {she}}",
		});
		// as editors store them, e.g. a new `=0` last
		rows.variants.reverse();
		expect(await exportJson(rows)).toEqual({
			cart: "{count, plural, =0 {none} one {# item} other {# items}}",
			pronoun: "{gender, select, female {she} male {he} other {they}}",
		});
	});

	test("text with ICU syntax is quoted, apostrophes only where next-intl needs it", async () => {
		const rows = await importJson({ a: "x" });
		rows.variants[0]!.pattern = [
			{ type: "text", value: "Don't use {braces}, <b> or it's" },
			{ type: "markup-standalone", name: "br" },
			{ type: "text", value: "'" },
			{
				type: "expression",
				arg: { type: "variable-reference", name: "name" },
			},
		];
		const { a } = await exportJson(rows);
		expect(a).toBe("Don't use '{'braces'}', '<'b> or it's<br></br>''{name}");
		expect(render(a, { name: "Ada" })).toBe(
			"Don't use {braces}, <b> or it's[br:]'Ada"
		);
	});
});

describe("data of plugin versions before ICU", () => {
	test("ICU syntax stored as variable names is written as those versions did", async () => {
		// how 2.2 imported `{count, plural, =0 {none} one {# item} other {# items}}`
		const variable = (name: string) => ({
			type: "expression" as const,
			arg: { type: "variable-reference" as const, name },
		});
		const rows = await importJson({ cart: "x" });
		rows.variants[0]!.pattern = [
			{ type: "text", value: "You have " },
			variable("count, plural, =0 {none"),
			{ type: "text", value: " one " },
			variable("# item"),
			{ type: "text", value: " other " },
			variable("# items"),
			{ type: "text", value: "}" },
		];
		expect(await exportJson(rows)).toEqual({
			cart: "You have {count, plural, =0 {none} one {# item} other {# items}}",
		});
	});
});

describe("escapeNextIntlText", () => {
	// every text of up to 4 characters that ICU syntax could break
	const alphabet = ["{", "}", "<", ">", "#", "'", "b", "/", " "];
	const texts: string[] = [""];
	for (let length = 1; length <= 4; length++) {
		for (const text of texts.filter((text) => text.length === length - 1)) {
			for (const char of alphabet) texts.push(text + char);
		}
	}

	const literal = (elements: ReturnType<typeof parse>) =>
		elements
			.map((element) => {
				if (element.type !== TYPE.literal) {
					throw new Error(`Not a literal: ${JSON.stringify(element)}`);
				}
				return element.value;
			})
			.join("");

	test("reads back as the text", () => {
		for (const text of texts) {
			const escaped = escapeNextIntlText(text, false);
			expect(literal(parse(escaped)), escaped).toBe(text);
			// followed by an argument, as an apostrophe at the end must not quote it
			const before = parse(`${escaped}{x}`);
			expect(before.at(-1)!.type, escaped).toBe(TYPE.argument);
			expect(literal(before.slice(0, -1)), escaped).toBe(text);
		}
	});

	test("reads back as the text in a plural", () => {
		for (const text of texts) {
			const escaped = escapeNextIntlText(text, true);
			const [plural] = parse(`{n, plural, other {${escaped}#}}`);
			if (plural?.type !== TYPE.plural) throw new Error(escaped);
			const elements = plural.options.other!.value;
			expect(elements.at(-1)!.type, escaped).toBe(TYPE.pound);
			expect(literal(elements.slice(0, -1)), escaped).toBe(text);
		}
	});
});
