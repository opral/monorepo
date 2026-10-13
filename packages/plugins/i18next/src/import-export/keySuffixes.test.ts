import { describe, expect, test } from "vitest";
import { flatten } from "flat";
import type {
	Bundle,
	ExistingFile,
	Message,
	Pattern,
	Variant,
} from "@inlang/sdk";
import { importFiles } from "./importFiles.js";
import { exportFiles } from "./exportFiles.js";

// A suffix of a key (`_one`, `_other`, a context like `_male`) is the end of
// the LAST path segment of a flattened key: `q_frame.a` is the key `a` of the
// group `q_frame`, not the context `frame.a` of a key `q`. The name of a group
// is never rewritten, and nothing in a file is lost or moved by an import:
// exporting the project writes the files it was imported from, byte for byte.

type Files = Record<string, string>;
type Rows = { bundles: Bundle[]; messages: Message[]; variants: Variant[] };
type PluginSettings = Record<string, unknown>;

describe("a group is not a context or plural suffix of another key", () => {
	test("`_frame` group with two keys", async () => {
		// the QA report: both keys collapsed into one bundle `q`
		const project = await loadProject({
			"en.json": json({ q_frame: { a: "x", b: "y" } }),
		});
		expect(bundleIds(project)).toStrictEqual(["q_frame.a", "q_frame.b"]);
		expect(project.imported.messages).toHaveLength(2);
		expect(project.imported.messages.map((m) => m.selectors)).toStrictEqual([
			[],
			[],
		]);
		expect(project.imported.variants.map((v) => v.matches)).toStrictEqual([
			[],
			[],
		]);
		await expectUnchangedByRoundTrip(project);
	});

	test.each([
		"one",
		"other",
		"zero",
		"few",
		"free",
		"male",
		"frame",
		"context",
	])("`_%s` group beside a key of the same name", async (suffix) => {
		const project = await loadProject({
			"en.json": json({
				q: "base",
				[`q_${suffix}`]: { a: "x", b: "y" },
			}),
		});
		expect(bundleIds(project)).toStrictEqual([
			"q",
			`q_${suffix}.a`,
			`q_${suffix}.b`,
		]);
		expect(project.imported.messages.map((m) => m.selectors)).toStrictEqual([
			[],
			[],
			[],
		]);
		await expectUnchangedByRoundTrip(project);
	});

	test("groups that differ only in their suffix", async () => {
		// `item_one.title` / `item_other.title` / `item_free.title` shared the
		// parent `item`, which made `item` a context root of three groups
		const project = await loadProject({
			"en.json": json({
				item_one: { title: "a" },
				item_other: { title: "b" },
				item_free: { title: "c" },
			}),
		});
		expect(bundleIds(project)).toStrictEqual([
			"item_one.title",
			"item_other.title",
			"item_free.title",
		]);
		expect(project.imported.variants.map((v) => v.matches)).toStrictEqual([
			[],
			[],
			[],
		]);
		await expectUnchangedByRoundTrip(project);
	});

	test("plural and context suffixes of keys inside of a suffixed group", async () => {
		const project = await loadProject({
			"en.json": json({
				cart_other: {
					count_one: "one",
					count_other: "{{count}}",
					title: "Cart",
					title_male: "His cart",
				},
				cart_male: { title: "Other cart" },
			}),
		});
		expect(bundleIds(project)).toStrictEqual([
			"cart_other.count",
			"cart_other.title",
			"cart_male.title",
		]);
		expect(
			project.imported.messages.find((m) => m.bundleId === "cart_other.count")
				?.selectors
		).toStrictEqual([{ type: "variable-reference", name: "countPlural" }]);
		expect(
			project.imported.messages.find((m) => m.bundleId === "cart_other.title")
				?.selectors
		).toStrictEqual([{ type: "variable-reference", name: "context" }]);
		await expectUnchangedByRoundTrip(project);
	});

	test("with the explicit `contextValues` of the group", async () => {
		const project = await loadProject(
			{ "en.json": json({ q_frame: { a: "x" }, q_free: { b: "y" } }) },
			{ contextValues: ["frame", "free"] }
		);
		expect(bundleIds(project)).toStrictEqual(["q_frame.a", "q_free.b"]);
		await expectUnchangedByRoundTrip(project);
	});

	test("rows that earlier versions imported for such keys export the same keys", async () => {
		// a project that saved what an earlier version imported (the bundle `q`
		// with the contexts `frame.a` and `frame.b`) writes the same file
		const text = json({ q_frame: { a: "x", b: "y" } }, "\t");
		const project = await loadProject({ "en.json": text });
		const form = (id: string, context: string, text: string) => ({
			id,
			messageId: "q-en",
			matches: [
				{ type: "literal-match" as const, key: "context", value: context },
			],
			pattern: [{ type: "text" as const, value: text }],
		});
		const earlier: Project = {
			...project,
			rows: {
				bundles: [
					{
						id: "q",
						declarations: [{ type: "input-variable", name: "context" }],
					},
				],
				messages: [
					{
						id: "q-en",
						bundleId: "q",
						locale: "en",
						selectors: [{ type: "variable-reference", name: "context" }],
					},
				],
				variants: [form("v1", "frame.a", "x"), form("v2", "frame.b", "y")],
			},
		};
		expect(await saveProject(earlier, false)).toStrictEqual({
			"en.json": text,
		});
		expect(await saveProject(earlier, true)).toStrictEqual({
			"en.json": text,
		});
	});

	test("in a namespace and in another locale", async () => {
		const project = await loadProject({
			"common/en": json({ q_frame: { a: "x", b: "y" }, q: "q" }),
			"common/de": json({ q_frame: { b: "y" } }),
			"app/en": json({ q_frame: { a: "app" } }),
		});
		expect(bundleIds(project)).toStrictEqual([
			"common:q_frame.a",
			"common:q_frame.b",
			"common:q",
			"app:q_frame.a",
		]);
		expect(
			project.imported.messages.map((m) => [m.bundleId, m.locale])
		).toStrictEqual([
			["common:q_frame.a", "en"],
			["common:q_frame.b", "en"],
			["common:q", "en"],
			["common:q_frame.b", "de"],
			["app:q_frame.a", "en"],
		]);
		await expectUnchangedByRoundTrip(project);
	});
});

describe("a suffix needs a name before it in its own path segment", () => {
	test("keys named like a suffix", async () => {
		// `_one` is the key `_one`, not the plural of a key without a name; its
		// bundle id was "" and `a.` for the key `_other` of the group `a`
		const project = await loadProject({
			"en.json": json({ _one: "x", a: { _other: "y", _free: "w" } }),
		});
		expect(bundleIds(project)).toStrictEqual(["_one", "a._other", "a._free"]);
		expect(project.imported.messages.map((m) => m.selectors)).toStrictEqual([
			[],
			[],
			[],
		]);
		await expectUnchangedByRoundTrip(project);
	});

	test("siblings of a key that starts with the separator of a suffix", async () => {
		const project = await loadProject({
			"en.json": json({ a: { _male: "x", _female: "y" } }),
		});
		expect(bundleIds(project)).toStrictEqual(["a._male", "a._female"]);
		await expectUnchangedByRoundTrip(project);
	});

	test("with the explicit `contextValues` of the key", async () => {
		const project = await loadProject(
			{ "en.json": json({ a: { _male: "x" }, b_male: "y" }) },
			{ contextValues: ["male"] }
		);
		expect(bundleIds(project)).toStrictEqual(["a._male", "b"]);
		await expectUnchangedByRoundTrip(project);
	});
});

describe("a key next to a key it is the context suffix of", () => {
	// `t("checkout.shipping", { context: "free" })` resolves
	// `checkout.shipping_free`, and the file can't tell that from two keys
	// that happen to share a prefix. The plugin keeps reading it as a context
	// of the base key (as it does for `friend` / `friend_male`): the bundle ids
	// of existing projects stay. Nothing is lost: both texts are variants of
	// the message, and the file is written back as it was. `contextValues`
	// decides which suffixes are contexts (see the README).
	const nested = json({
		checkout: { shipping: "Shipping", shipping_free: "Free shipping" },
	});
	const flat = json({
		"checkout.shipping": "Shipping",
		"checkout.shipping_free": "Free shipping",
	});
	const mixed = json({
		checkout: { shipping: "Shipping" },
		"checkout.shipping_free": "Free shipping",
	});

	test.each(Object.entries({ nested, flat, mixed }))(
		"%s file: both texts are in the project",
		async (_, text) => {
			const project = await loadProject({ "en.json": text });
			expect(bundleIds(project)).toStrictEqual(["checkout.shipping"]);
			expect(project.imported.messages).toStrictEqual([
				{
					bundleId: "checkout.shipping",
					locale: "en",
					selectors: [{ type: "variable-reference", name: "context" }],
				},
			]);
			expect(forms(project)).toStrictEqual([
				["checkout.shipping", "en", "context=free", "Free shipping"],
				["checkout.shipping", "en", "context=*", "Shipping"],
			]);
			await expectUnchangedByRoundTrip(project);
		}
	);

	test.each([
		["no context values", []],
		["other context values", ["male", "female"]],
	])("with %s, the suffix is part of the key", async (_, contextValues) => {
		const project = await loadProject({ "en.json": nested }, { contextValues });
		expect(bundleIds(project)).toStrictEqual([
			"checkout.shipping",
			"checkout.shipping_free",
		]);
		expect(project.imported.messages.map((m) => m.selectors)).toStrictEqual([
			[],
			[],
		]);
		expect(forms(project)).toStrictEqual([
			["checkout.shipping", "en", "", "Shipping"],
			["checkout.shipping_free", "en", "", "Free shipping"],
		]);
		await expectUnchangedByRoundTrip(project);
	});

	test("with the context in the context values", async () => {
		const project = await loadProject(
			{ "en.json": nested },
			{ contextValues: ["free"] }
		);
		expect(bundleIds(project)).toStrictEqual(["checkout.shipping"]);
		expect(forms(project)).toStrictEqual([
			["checkout.shipping", "en", "context=free", "Free shipping"],
			["checkout.shipping", "en", "context=*", "Shipping"],
		]);
		await expectUnchangedByRoundTrip(project);
	});

	test("an edit of the context variant changes only its line", async () => {
		const text = `{
  "checkout": {
    "shipping_free": "Free shipping",
    "shipping": "Shipping"
  }
}
`;
		const project = await loadProject({ "en.json": text });
		const free = project.rows.variants.find((variant) =>
			variant.matches.some(
				(match) => match.type === "literal-match" && match.value === "free"
			)
		)!;
		free.pattern = [{ type: "text", value: "Shipping is free" }];
		expect(await saveProject(project, true)).toStrictEqual({
			"en.json": text.replace("Free shipping", "Shipping is free"),
		});
	});

	test("with plural forms, in a sparse locale", async () => {
		const project = await loadProject({
			"en.json": json({
				key_context_one: "one",
				key_context_other: "{{count}}",
				key: "base",
				key_context: "context",
			}),
			"de.json": json({ key_context_one: "eins" }),
		});
		expect(bundleIds(project)).toStrictEqual(["key"]);
		expect(forms(project)).toContainEqual([
			"key",
			"de",
			"context=context countPlural=one",
			"eins",
		]);
		await expectUnchangedByRoundTrip(project);
	});

	test("with the legacy numeric forms of a plural", async () => {
		// `_0` / `_1` aren't plural categories: they are contexts, as before
		const project = await loadProject({
			"en.json": json({ item_0: "none", item_1: "one", item_2: "two" }),
		});
		expect(bundleIds(project)).toStrictEqual(["item"]);
		expect(project.imported.messages[0]?.selectors).toStrictEqual([
			{ type: "variable-reference", name: "context" },
		]);
		await expectUnchangedByRoundTrip(project);
	});
});

describe("the files of a project are written back as they were", () => {
	const layouts: Files = {
		"nested, sorted": json({
			nav: { home: "Home", home_free: "Free home" },
			q: "q",
			q_frame: { a: "x", b: "y" },
		}),
		"flat keys": json({
			"nav.home": "Home",
			"nav.home_free": "Free home",
			q: "q",
			"q_frame.a": "x",
			"q_frame.b": "y",
		}),
		"mixed, unsorted, CRLF, no final newline": json(
			{
				"q_frame.b": "y",
				q_frame: { a: "x" },
				nav: { home_free: "Free home" },
				"nav.home": "Home",
				q: "q",
			},
			"    "
		)
			.replace(/\n/g, "\r\n")
			.trimEnd(),
		minified: JSON.stringify({
			q_frame: { b: "y", a: "x" },
			nav: { home_free: "Free home", home: "Home" },
			q: "q",
		}),
	};

	test.each(Object.entries(layouts))("%s", async (_, text) => {
		const project = await loadProject({ "en.json": text });
		await expectUnchangedByRoundTrip(project);
		// the files are kept as they are, so a host writes them as they are
		const exported = await exportFiles({
			...structuredClone(project.rows),
			settings: project.settings,
			files: project.existing,
		});
		expect(exported.every((file) => file.verbatim === true)).toBe(true);
	});
});

describe("random keys with suffix-like names", () => {
	test("every leaf is in the project and the files are written back as they were", async () => {
		const problems: string[] = [];
		const iterations = 600;
		for (let seed = 1; seed <= iterations; seed++) {
			problems.push(...(await checkRandomProject(seed)));
		}
		expect(problems).toStrictEqual([]);
	});
});

// ----------------------------------------------------------------------------

/**
 * Imports random files and checks that
 *
 * - every leaf of every file is a variant of the project, whose bundle id is
 *   the key or the key without a suffix of its last path segment,
 * - the project doesn't depend on how the files are laid out (nested or flat
 *   keys, key order, whitespace),
 * - exporting the project, with the files as they were, writes the files byte
 *   for byte, and without them writes the same keys and texts,
 * - importing that export gives the project again.
 *
 * Returns what failed, for the seed that produced the files.
 */
async function checkRandomProject(seed: number): Promise<string[]> {
	const random = mulberry32(seed);
	const pick = <T>(items: readonly T[]): T =>
		items[Math.floor(random() * items.length)]!;
	const keys = randomKeys(random);
	const namespaces = random() < 0.3 ? ["common", "app"] : [undefined];
	const locales = random() < 0.5 ? ["en"] : ["en", "de"];
	const contextValues = pick([
		undefined,
		undefined,
		undefined,
		[],
		["free", "male", "frame"],
	]);

	// each file has some of the keys: translations are sparse
	const leaves: Array<{
		locale: string;
		namespace: string | undefined;
		key: string;
		text: string;
	}> = [];
	const files: Files = {};
	const canonical: Files = {};
	const flatFiles: Files = {};
	for (const namespace of namespaces) {
		for (const locale of locales) {
			const own = keys.filter(() => random() < 0.8);
			if (own.length === 0) continue;
			const resource = new Map<string, string>();
			for (const key of own) {
				const text = `${random() < 0.2 ? "{{count}} " : ""}t${leaves.length}`;
				resource.set(key, text);
				leaves.push({ locale, namespace, key, text });
			}
			const name = nameOf(locale, namespace);
			files[name] = renderFile(resource, random);
			canonical[name] = JSON.stringify(unflattenKeys(resource, "nested"));
			flatFiles[name] = JSON.stringify(Object.fromEntries(resource));
		}
	}
	const describeInput = `seed ${seed}${
		contextValues === undefined
			? ""
			: ` contextValues ${JSON.stringify(contextValues)}`
	}: ${JSON.stringify(files)}`;
	const problems: string[] = [];
	const fail = (message: string) =>
		problems.push(`${message} (${describeInput})`);

	try {
		const pluginSettings = contextValues === undefined ? {} : { contextValues };
		const project = await loadProject(files, pluginSettings);

		// every leaf is in the project, under the key or the key without a suffix
		const variantsByText = new Map<string, Imported["variants"]>();
		for (const variant of project.imported.variants) {
			const text = textOf(variant.pattern as Pattern);
			variantsByText.set(text, [...(variantsByText.get(text) ?? []), variant]);
		}
		for (const { locale, namespace, key, text } of leaves) {
			const variants = (variantsByText.get(text) ?? []).filter(
				(variant) => variant.messageLocale === locale
			);
			// `_zero` is an exact 0 and the plural category zero
			if (
				variants.length !== 1 &&
				!(variants.length === 2 && key.endsWith("_zero"))
			) {
				fail(`${variants.length} variants for ${locale} ${namespace}:${key}`);
				continue;
			}
			const prefix = namespace === undefined ? "" : `${namespace}:`;
			for (const variant of variants) {
				const id = variant.messageBundleId!;
				const bundleKey = id.slice(prefix.length);
				const rest = key.slice(bundleKey.length);
				if (
					!id.startsWith(prefix) ||
					!key.startsWith(bundleKey) ||
					bundleKey === "" ||
					bundleKey.endsWith(".") ||
					rest.includes(".") ||
					!(rest === "" || rest.startsWith("_"))
				) {
					fail(`bundle ${id} for the key ${key}`);
				}
			}
		}

		// the layout of the files doesn't matter
		for (const other of [canonical, flatFiles]) {
			const imported = await loadProject(other, pluginSettings);
			if (
				JSON.stringify(normalized(imported.imported)) !==
				JSON.stringify(normalized(project.imported))
			) {
				fail("the project depends on the layout of the files");
			}
		}

		// exporting with the files writes them as they were
		const saved = await saveProject(project, true);
		if (JSON.stringify(saved) !== JSON.stringify(sorted(files))) {
			fail("the export with the files differs from the files");
		}
		// without the files, it writes the same keys and texts
		const whole = await saveProject(project, false);
		for (const [name, text] of Object.entries(files)) {
			if (
				JSON.stringify(flattenSorted(whole[name])) !==
				JSON.stringify(flattenSorted(text))
			) {
				fail(`the export without the files differs from ${name}`);
			}
		}
		// and importing it gives the project again
		const reloaded = await loadProject(whole, pluginSettings);
		if (
			JSON.stringify(normalized(reloaded.imported)) !==
			JSON.stringify(normalized(project.imported))
		) {
			fail("importing the export doesn't give the project");
		}
	} catch (error) {
		fail(`threw ${error instanceof Error ? error.message : String(error)}`);
	}
	return problems;
}

const NAMES = ["shipping", "frame", "q", "item", "a", "free_ship"];
const SUFFIXES = [
	"_one",
	"_other",
	"_zero",
	"_two",
	"_few",
	"_many",
	"_free",
	"_frame",
	"_male",
	"_female",
	"_context",
	"_ordinal_one",
	"_ordinal_other",
	"_male_one",
	"_free_other",
	"_0",
	"_1",
];

/**
 * Random flattened keys (`a.b_one`) that don't contain each other: a key is a
 * leaf, not also a group. Names, and keys derived from keys that exist (a
 * group or a key with a suffix, to get the key it is the suffix of), are
 * suffix-like.
 */
function randomKeys(random: () => number): string[] {
	const pick = <T>(items: readonly T[]): T =>
		items[Math.floor(random() * items.length)]!;
	const keys: string[] = [];
	const free = (key: string) =>
		!keys.some(
			(other) =>
				other === key ||
				other.startsWith(`${key}.`) ||
				key.startsWith(`${other}.`)
		);
	const count = 1 + Math.floor(random() * 8);
	for (let attempt = 0; attempt < count * 3 && keys.length < count; attempt++) {
		let segments: string[];
		if (keys.length > 0 && random() < 0.6) {
			// derived: a suffix on a segment of a key that exists
			segments = pick(keys).split(".");
			const index = Math.floor(random() * segments.length);
			segments[index] = segments[index]! + pick(SUFFIXES);
			if (random() < 0.3) segments.push(pick(NAMES) + pick(["", ...SUFFIXES]));
		} else {
			segments = Array.from({ length: 1 + Math.floor(random() * 3) }, () =>
				random() < 0.15 ? pick(SUFFIXES) : pick(NAMES) + pick(["", ...SUFFIXES])
			);
		}
		const key = segments.join(".");
		if (free(key)) keys.push(key);
	}
	return keys;
}

/**
 * `{ "a.b": "x" }` as an object with nested keys, or with the last segments
 * of a key joined into one flat key (`{ "a": { "b.c": "x" } }`).
 *
 * A flat key holds a text, never an object: a group that is written both as a
 * flat key and as a nested object, e.g. `{ "a.b": { "c": "x" }, "a": { "b":
 * { "d": "y" } } }`, is not written back as it was whatever its keys are (the
 * SDK's `keepUnchangedJsonEntries` writes the whole file then).
 */
function unflattenKeys(
	resource: Map<string, string>,
	layout: "nested" | "mixed",
	random: () => number = () => 0
): Record<string, unknown> {
	const root: Record<string, unknown> = {};
	for (const [key, text] of resource) {
		const segments = key.split(".");
		const joined =
			layout === "mixed" ? 1 + Math.floor(random() * segments.length) : 1;
		const names = [
			...segments.slice(0, segments.length - joined),
			segments.slice(segments.length - joined).join("."),
		];
		let node = root;
		for (const name of names.slice(0, -1)) {
			node = (node[name] ??= {}) as Record<string, unknown>;
		}
		node[names.at(-1)!] = text;
	}
	return root;
}

/** A file the way people write it: any layout, order, whitespace, line endings */
function renderFile(
	resource: Map<string, string>,
	random: () => number
): string {
	const entries = [...resource];
	if (random() < 0.5) {
		// Fisher-Yates
		for (let index = entries.length - 1; index > 0; index--) {
			const other = Math.floor(random() * (index + 1));
			[entries[index], entries[other]] = [entries[other]!, entries[index]!];
		}
	}
	const layout = random();
	const value =
		layout < 0.2
			? Object.fromEntries(entries)
			: unflattenKeys(
					new Map(entries),
					layout < 0.6 ? "nested" : "mixed",
					random
				);
	const indent = [undefined, "\t", "  ", "    "][Math.floor(random() * 4)];
	const eol = random() < 0.2 ? "\r\n" : "\n";
	const text = JSON.stringify(value, undefined, indent).replace(/\n/g, eol);
	return random() < 0.7 ? text + eol : text;
}

/** mulberry32, so that a failing seed can be reproduced */
function mulberry32(seed: number): () => number {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** the project without anything that depends on the order of the keys */
function normalized(imported: Imported) {
	const key = (value: unknown) => JSON.stringify(value);
	return {
		bundles: imported.bundles.map((bundle) => bundle.id).sort(),
		messages: imported.messages.map(key).sort(),
		variants: imported.variants.map(key).sort(),
	};
}

function sorted(files: Files): Files {
	return Object.fromEntries(
		Object.entries(files).sort(([a], [b]) => (a < b ? -1 : 1))
	);
}

function flattenSorted(text: string | undefined): Array<[string, unknown]> {
	if (text === undefined) return [];
	return Object.entries(
		flatten(JSON.parse(text)) as Record<string, unknown>
	).sort(([a], [b]) => (a < b ? -1 : 1));
}

// ----------------------------------------------------------------------------

type Imported = Awaited<ReturnType<typeof importFiles>>;

function json(value: unknown, indent: string | number = 2): string {
	return JSON.stringify(value, undefined, indent) + "\n";
}

function textOf(pattern: Pattern): string {
	return pattern
		.map((part) =>
			part.type === "text"
				? part.value
				: part.type === "expression" && part.arg.type === "variable-reference"
					? `{{${part.arg.name}}}`
					: ""
		)
		.join("");
}

/** `<namespace>/<locale>` or `<locale>.json` */
function nameOf(locale: string, namespace: string | undefined): string {
	return namespace === undefined ? `${locale}.json` : `${namespace}/${locale}`;
}

function parseName(name: string): { locale: string; namespace?: string } {
	const namespaced = name.match(/^(.+)\/(.+)$/);
	if (namespaced) return { namespace: namespaced[1]!, locale: namespaced[2]! };
	return { locale: name.replace(/\.json$/, "") };
}

async function loadProject(files: Files, pluginSettings: PluginSettings = {}) {
	const namespaces = [
		...new Set(Object.keys(files).map((name) => parseName(name).namespace)),
	].filter((namespace): namespace is string => namespace !== undefined);
	const pathPattern =
		namespaces.length === 0
			? "./{locale}.json"
			: Object.fromEntries(
					namespaces.map((namespace) => [
						namespace,
						`./{locale}/${namespace}.json`,
					])
				);
	const settings = {
		baseLocale: "en",
		locales: ["en", "de"],
		"plugin.inlang.i18next": { pathPattern, ...pluginSettings },
	};
	const existing: ExistingFile[] = Object.entries(files).map(([name, text]) => {
		const { locale, namespace } = parseName(name);
		return {
			path:
				typeof pathPattern === "string"
					? pathPattern.replace("{locale}", locale)
					: pathPattern[namespace!]!.replace("{locale}", locale),
			locale,
			content: new TextEncoder().encode(text),
			...(namespace === undefined ? {} : { metadata: { namespace } }),
		};
	});
	const imported = await importFiles({
		settings,
		files: existing.map((file) => ({
			locale: file.locale,
			content: file.content,
			toBeImportedFilesMetadata: file.metadata,
		})),
	});
	// one message per bundle and locale, like the database of a project
	const messages = [
		...new Map(
			imported.messages.map((message) => [
				`${message.bundleId}-${message.locale}`,
				{ ...message, id: `${message.bundleId}-${message.locale}` },
			])
		).values(),
	] as Message[];
	const variants = imported.variants.map((variant, index) => ({
		...variant,
		id: `variant-${index}`,
		messageId: `${variant.messageBundleId}-${variant.messageLocale}`,
	})) as Variant[];
	const rows: Rows = {
		bundles: imported.bundles as Bundle[],
		messages,
		variants,
	};
	return { settings, existing, imported, rows };
}

type Project = Awaited<ReturnType<typeof loadProject>>;

/** Exports the project, with its files as they were if `withFiles`. */
async function saveProject(
	project: Project,
	withFiles: boolean
): Promise<Files> {
	const exported = await exportFiles({
		...structuredClone(project.rows),
		settings: project.settings,
		files: withFiles ? project.existing : undefined,
	});
	return Object.fromEntries(
		exported
			.map((file) => [
				nameOf(file.locale, file.metadata?.namespace),
				new TextDecoder("utf-8", { ignoreBOM: true }).decode(file.content),
			])
			.sort(([a], [b]) => (a! < b! ? -1 : 1))
	);
}

/**
 * Exporting the project with its files writes them byte for byte, and
 * without them writes the same keys and texts.
 */
async function expectUnchangedByRoundTrip(project: Project) {
	const files = Object.fromEntries(
		project.existing.map((file) => [
			nameOf(file.locale, file.metadata?.namespace),
			new TextDecoder("utf-8", { ignoreBOM: true }).decode(file.content),
		])
	);
	expect(await saveProject(project, true)).toStrictEqual(sorted(files));
	const whole = await saveProject(project, false);
	expect(
		Object.fromEntries(
			Object.entries(whole).map(([name, text]) => [name, flattenSorted(text)])
		)
	).toStrictEqual(
		Object.fromEntries(
			Object.entries(sorted(files)).map(([name, text]) => [
				name,
				flattenSorted(text),
			])
		)
	);
}

function bundleIds(project: Project): string[] {
	return project.imported.bundles.map((bundle) => bundle.id!);
}

/**
 * `[bundle id, locale, matches, text]` of every variant, in the order of
 * import. Matches are `key=value` (`*` for a catchall match) separated by
 * spaces.
 */
function forms(project: Project): string[][] {
	return project.imported.variants.map((variant) => [
		variant.messageBundleId!,
		variant.messageLocale!,
		(variant.matches ?? [])
			.map(
				(match) =>
					`${match.key}=${match.type === "literal-match" ? match.value : "*"}`
			)
			.join(" "),
		textOf(variant.pattern as Pattern),
	]);
}
