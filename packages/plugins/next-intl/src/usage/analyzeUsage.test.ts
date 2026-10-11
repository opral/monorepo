import { describe, expect, test } from "vitest";
import { analyzeUsage } from "./analyzeUsage.js";

const settings = {
	baseLocale: "en",
	locales: ["en", "de"],
	modules: [],
	"plugin.inlang.nextIntl": { pathPattern: "./messages/{locale}.json" },
};
const analyze = async (content: string, path = "src/app/page.tsx") =>
	await analyzeUsage({ files: [{ path, content }], settings });
const ids = (result: { usedBundleIds: readonly string[] }) =>
	[...result.usedBundleIds].sort();

describe("resolved usages", () => {
	test("useTranslations with a namespace: t, t.rich and t.markup", async () => {
		const result = await analyze(`"use client";
import { useTranslations } from "next-intl";
export default function Page() {
	const t = useTranslations("Home");
	return <div title={t("tooltip")}>{t("title", { name: "x" })}{t.rich("terms", { b: (c) => <b>{c}</b> })}{t.markup("markup", { b: (c) => c })}</div>;
}`);
		expect(result.issues).toEqual([]);
		expect(result.status).toBe("complete");
		expect(ids(result)).toEqual([
			"Home.markup",
			"Home.terms",
			"Home.title",
			"Home.tooltip",
		]);
	});

	test("getTranslations in Server Components, with a namespace, an object or none", async () => {
		const result =
			await analyze(`import { getTranslations } from "next-intl/server";
export async function generateMetadata({ params }) {
	const { locale } = await params;
	const t = await getTranslations({ locale, namespace: "Metadata" });
	const root = await getTranslations({ locale });
	return { title: t("title"), description: root("Metadata.description") };
}
export default async function Page() {
	const t = await getTranslations("Nav");
	const all = await getTranslations();
	return <nav>{t("home")}{all("Nav.links.about")}</nav>;
}`);
		expect(result.status).toBe("complete");
		expect(ids(result)).toEqual([
			"Metadata.description",
			"Metadata.title",
			"Nav.home",
			"Nav.links.about",
		]);
	});

	test("nested namespaces and dot keys join to the plugin's bundle IDs", async () => {
		const result = await analyze(`import { useTranslations } from "next-intl";
const t = useTranslations("Checkout.Summary");
const root = useTranslations();
t("title"); t("shipping.free"); root("Nav.links.home");`);
		expect(result.status).toBe("complete");
		expect(ids(result)).toEqual([
			"Checkout.Summary.shipping.free",
			"Checkout.Summary.title",
			"Nav.links.home",
		]);
	});

	test("aliases, reassignments, renamed imports and namespace imports", async () => {
		const result =
			await analyze(`import { useTranslations as useT } from "next-intl";
import * as intl from "next-intl";
import intlDefault from "next-intl";
const t = useT("A");
const tt = t;
let late;
late = tt;
late("one");
const u = intl.useTranslations("B");
u("two");
const { useTranslations } = intl;
useTranslations("C")("three");
intlDefault.useTranslations("D")("four");
(await import("next-intl/server")).getTranslations("E").then;`);
		// the last line uses a promise without await: incomplete, but the others resolve
		expect(ids(result)).toEqual(["A.one", "B.two", "C.three", "D.four"]);
	});

	test("keys known statically: constants, ternaries, templates and concatenation", async () => {
		const result = await analyze(`import { useTranslations } from "next-intl";
const PREFIX = "items";
export function List({ open }) {
	const t = useTranslations("List");
	const key = "title";
	const kind = open ? "open" : "closed";
	return [t(key), t(open ? "close" : "expand"), t(\`\${PREFIX}.first\`), t("a" + ".b"), t(\`state.\${kind}\`), t(\`plain\`), t("ti\\u0074le2"), t(1)];
}`);
		expect(result.issues).toEqual([]);
		expect(ids(result)).toEqual([
			"List.1",
			"List.a.b",
			"List.close",
			"List.expand",
			"List.items.first",
			"List.plain",
			"List.state.closed",
			"List.state.open",
			"List.title",
			"List.title2",
		]);
	});

	test("arrays of keys, as the next-intl docs show for lists", async () => {
		const result = await analyze(`import { useTranslations } from "next-intl";
const sections = ["intro", "pricing"] as const;
export function Faq() {
	const t = useTranslations("Faq");
	const keys = ["one", "two"] as const;
	const rows = [];
	for (const section of sections) rows.push(t(\`\${section}.title\`));
	return <ul>{keys.map((key) => <li key={key}>{t(\`\${key}.question\`)}</li>)}{keys.length}</ul>;
}`);
		expect(result.issues).toEqual([]);
		expect(ids(result)).toEqual([
			"Faq.intro.title",
			"Faq.one.question",
			"Faq.pricing.title",
			"Faq.two.question",
		]);
	});

	test("TypeScript wrappers, optional calls and computed method names", async () => {
		const result = await analyze(
			`import { useTranslations } from "next-intl";
const t = useTranslations("T");
(t as any)("a"); t!("b"); t?.("c"); (0, t)("d"); t["rich"]("e"); t[\`markup\`]("f"); t.rich?.("g");
(t satisfies unknown)("h"); t<"x">("i"); const rich = t.rich; rich("j");`,
			"src/x.ts"
		);
		expect(result.issues).toEqual([]);
		expect(ids(result)).toEqual([
			"T.a",
			"T.b",
			"T.c",
			"T.d",
			"T.e",
			"T.f",
			"T.g",
			"T.h",
			"T.i",
			"T.j",
		]);
	});

	test("React dependency arrays only compare the translator", async () => {
		const result = await analyze(`import { useTranslations } from "next-intl";
import { useCallback, useMemo, useEffect } from "react";
export function C() {
	const t = useTranslations("C");
	const label = useMemo(() => t("memo"), [t]);
	const onClick = useCallback(() => alert(t("click")), [t]);
	useEffect(() => { document.title = t("doc"); }, [t]);
	return label;
}`);
		expect(result.issues).toEqual([]);
		expect(ids(result)).toEqual(["C.click", "C.doc", "C.memo"]);
	});

	test("the whole catalog passed to NextIntlClientProvider, the request config or createTranslator", async () => {
		const layout =
			await analyze(`import { NextIntlClientProvider, useMessages } from "next-intl";
import { getMessages } from "next-intl/server";
export default async function Layout({ children }) {
	const messages = await getMessages();
	return <NextIntlClientProvider messages={messages}>{children}</NextIntlClientProvider>;
}
export function Client({ children }) {
	return <NextIntlClientProvider messages={useMessages()}>{children}</NextIntlClientProvider>;
}`);
		expect(layout.issues).toEqual([]);
		const request = await analyze(
			`import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import deepmerge from "deepmerge";
export default getRequestConfig(async ({ requestLocale }) => {
	const requested = await requestLocale;
	const locale = hasLocale(["en", "de"], requested) ? requested : "en";
	const fallback = (await import("../../messages/en.json")).default;
	const messages = (await import(\`../../messages/\${locale}.json\`)).default;
	if (locale === "de") return { locale, messages: deepmerge(fallback, messages) };
	return { locale, messages };
});`,
			"src/i18n/request.ts"
		);
		expect(request.issues).toEqual([]);
		const arrow = await analyze(
			`import { getRequestConfig } from "next-intl/server";
export default getRequestConfig(async ({ locale }) => ({
	messages: { ...(await import(\`../messages/\${locale}/common.json\`)).default, Home: (await import(\`../messages/\${locale}/home.json\`)).default },
}));`,
			"src/i18n.ts"
		);
		expect(arrow.issues).toEqual([]);
		const translator = await analyze(
			`import { createTranslator } from "next-intl";
import en from "../messages/en.json";
const t = createTranslator({ locale: "en", messages: en, namespace: "Email" });
t("subject");`,
			"src/email.ts"
		);
		expect(translator.issues).toEqual([]);
		expect(translator.usedBundleIds).toEqual(["Email.subject"]);
	});

	test("typing next-intl with typeof the messages keeps the analysis complete", async () => {
		const result = await analyze(
			`import messages from "./messages/en.json";
import { routing } from "@/i18n/routing";
declare module "next-intl" {
	interface AppConfig {
		Locale: (typeof routing.locales)[number];
		Messages: typeof messages;
	}
}
type Messages = typeof messages;
declare global { interface IntlMessages extends Messages {} }`,
			"src/global.d.ts"
		);
		expect(result.issues).toEqual([]);
		expect(result.status).toBe("complete");
	});

	test("formatters, locale and navigation are not message access", async () => {
		const result =
			await analyze(`import { useFormatter, useLocale, useNow, useTimeZone } from "next-intl";
import { getFormatter, getLocale, getNow, setRequestLocale } from "next-intl/server";
import { createNavigation } from "next-intl/navigation";
import createMiddleware from "next-intl/middleware";
import { routing } from "./routing";
export const { Link, redirect } = createNavigation(routing);
export default createMiddleware(routing);
const format = useFormatter(); format.number(1); useLocale(); useNow(); useTimeZone();
await getFormatter(); await getLocale(); await getNow(); setRequestLocale("en");`);
		expect(result.issues).toEqual([]);
		expect(result.usedBundleIds).toEqual([]);
	});

	test("comments, strings and other JSON files are not usages", async () => {
		const result = await analyze(`import { useTranslations } from "next-intl";
import pkg from "../package.json";
import data from "@/data/products.json";
// t("fake")
const text = "t('fake')";
const t = useTranslations("Real");
t("used");
export const version = pkg.version + data.length;`);
		expect(result.issues).toEqual([]);
		expect(ids(result)).toEqual(["Real.used"]);
	});

	test("shadowed names: an unrelated t is not a translator, an inner translator has its own namespace", async () => {
		const result = await analyze(`import { useTranslations } from "next-intl";
export function A({ items }) {
	const t = useTranslations("A");
	const names = items.map((t) => t.name);
	{
		const t = useTranslations("Inner");
		t("x");
	}
	function helper() { const t = { name: 1 }; return t.name; }
	return [t("y"), names, helper(), later("z")];
	var later = t;
}`);
		expect(result.issues).toEqual([]);
		expect(ids(result)).toEqual(["A.y", "A.z", "Inner.x"]);
	});

	test("t.has and t.raw of a key that is also translated are resolved", async () => {
		const result = await analyze(`import { useTranslations } from "next-intl";
const t = useTranslations("Home");
t.has("subtitle") ? t("subtitle") : null;
t.raw("html") && t.rich("html", {});`);
		expect(result.issues).toEqual([]);
		expect(ids(result)).toEqual(["Home.html", "Home.subtitle"]);
	});

	test("CommonJS, JavaScript and JSX files", async () => {
		const cjs = await analyze(
			`const { useTranslations } = require("next-intl");
const path = require("node:path");
const t = useTranslations("Cjs"); t("a"); require.resolve("x");`,
			"src/legacy.cjs"
		);
		expect(cjs.issues).toEqual([]);
		expect(cjs.usedBundleIds).toEqual(["Cjs.a"]);
		const jsx = await analyze(
			`import { useTranslations } from "next-intl";
export default function A() { const t = useTranslations("Jsx"); return <p>{t("b")}</p>; }`,
			"src/a.jsx"
		);
		expect(jsx.usedBundleIds).toEqual(["Jsx.b"]);
		const js = await analyze(
			`import { getTranslations } from "next-intl/server";
export default async function A() { const t = await getTranslations("Js"); return <p>{t("c")}</p>; }`,
			"src/a.js"
		);
		expect(js.usedBundleIds).toEqual(["Js.c"]);
	});

	test("dynamic imports of source files are analyzed on their own", async () => {
		const result =
			await analyze(`export default async function Page({ params }) {
	const { slug } = await params;
	const { default: Content } = await import(\`@/content/\${slug}.mdx\`);
	const Lazy = (await import("./Lazy")).default;
	return <Content />;
}`);
		expect(result.issues).toEqual([]);
	});

	test("reports where each message is used, covering the whole call", async () => {
		const content = `import { useTranslations } from "next-intl";
const t = useTranslations("Home");
const a = t("title");
const b = t.rich("terms",
  {});`;
		const result = await analyze(content);
		expect(result.references).toEqual([
			{
				bundleId: "Home.title",
				path: "src/app/page.tsx",
				start: { line: 3, column: 10 },
				end: { line: 3, column: 20 },
			},
			{
				bundleId: "Home.terms",
				path: "src/app/page.tsx",
				start: { line: 4, column: 10 },
				end: { line: 5, column: 5 },
			},
		]);
	});
});

describe("MDX", () => {
	test("components in import/export blocks and expressions are analyzed", async () => {
		const content = `import { useTranslations } from "next-intl";
import { Callout } from "@/components/Callout";

export function Hero() {
  const t = useTranslations("Docs");
  return <h1>{t("title")}</h1>;
}

# Getting started

<Hero />

Some *text* {"with an expression"} and <Callout title="Note" kind={1 + 1}>child</Callout>

> {[1, 2].map(
>   (n) => n * 2
> )}
`;
		const result = await analyze(content, "src/content/start.mdx");
		expect(result.issues).toEqual([]);
		expect(result.usedBundleIds).toEqual(["Docs.title"]);
		expect(result.references).toEqual([
			{
				bundleId: "Docs.title",
				path: "src/content/start.mdx",
				start: { line: 6, column: 14 },
				end: { line: 6, column: 24 },
			},
		]);
	});

	test("a translator in MDX expressions and attributes is located in the MDX file", async () => {
		const content = `import { getTranslations } from "next-intl/server";
export const t = await getTranslations("Docs");

# {t("title")}

<Note label={t(props.key)} />
`;
		const result = await analyze(content, "src/content/page.mdx");
		expect(result.status).toBe("incomplete");
		expect(result.usedBundleIds).toEqual(["Docs.title"]);
		expect(result.issues).toEqual([
			expect.objectContaining({
				path: "src/content/page.mdx",
				start: { line: 2, column: 13 },
				reason: expect.stringContaining("translator"),
			}),
			expect.objectContaining({
				path: "src/content/page.mdx",
				start: { line: 6, column: 15 },
				end: { line: 6, column: 24 },
				reason: expect.stringContaining("dynamic message key"),
			}),
		]);
	});

	test("invalid MDX is a located parse failure", async () => {
		const result = await analyze(
			"# Title\n\n<div {x} \n",
			"src/content/broken.mdx"
		);
		expect(result.status).toBe("incomplete");
		expect(result.issues![0]).toEqual(
			expect.objectContaining({
				path: "src/content/broken.mdx",
				reason: expect.stringContaining("Cannot parse"),
			})
		);
	});
});

const incomplete = [
	// dynamic keys
	[
		"a key from a parameter",
		`const t = useTranslations("A"); export const f = (key) => t(key);`,
	],
	[
		"a template with a dynamic part",
		`const t = useTranslations("A"); export const f = (id) => t(\`items.\${id}\`);`,
	],
	[
		"a template with a static suffix",
		`const t = useTranslations("A"); export const f = (id) => t(\`\${id}.title\`);`,
	],
	[
		"a spread key",
		`const t = useTranslations("A"); export const f = (args) => t(...args);`,
	],
	[
		"a reassigned key",
		`const t = useTranslations("A"); let key = "a"; key = window.name; t(key);`,
	],
	[
		"an array that is changed",
		`const t = useTranslations("A"); const keys = ["a"]; keys.push(window.name); keys.map((k) => t(k));`,
	],
	[
		"an array passed on",
		`const t = useTranslations("A"); const keys = ["a"]; mutate(keys); for (const k of keys) t(k);`,
	],
	[
		"an exported array",
		`const t = useTranslations("A"); export const keys = ["a"]; keys.forEach((k) => t(k));`,
	],
	[
		"a named callback calling itself",
		`const t = useTranslations("A"); ["a"].map(function f(k, i) { if (i < 1) f(window.name, 1); return t(k); });`,
	],
	[
		"a callback changing the array",
		`const t = useTranslations("A"); ["a", "b"].forEach((k, i, all) => { all[1] = window.name; t(k); });`,
	],
	[
		"a callback reading arguments",
		`const t = useTranslations("A"); ["a"].map(function (k) { arguments[0] = window.name; return t(k); });`,
	],
	[
		"a destructured callback parameter",
		`const t = useTranslations("A"); [["a"]].map(([k]) => t(k));`,
	],
	[
		"a reassigned callback parameter",
		`const t = useTranslations("A"); ["a"].map((k) => { k = window.name; return t(k); });`,
	],
	[
		"a key of t.rich from a variable",
		`const t = useTranslations("A"); export const f = (k) => t.rich(k, {});`,
	],
	// namespaces
	[
		"a namespace from a variable",
		`export const f = (ns) => useTranslations(ns)("title");`,
	],
	[
		"a namespace option from a variable",
		`export const f = async (ns) => (await getTranslations({ namespace: ns }))("title");`,
	],
	[
		"spread translator options",
		`export const f = async (options) => (await getTranslations({ ...options }))("title");`,
	],
	[
		"a namespace from an object",
		`export const f = async (options) => (await getTranslations(options))("title");`,
	],
	[
		"createTranslator with spread options",
		`export const f = (config) => createTranslator({ ...config })("x");`,
	],
	// escapes
	["t passed to a function", `const t = useTranslations("A"); format(t);`],
	[
		"t passed to a child",
		`const t = useTranslations("A"); export const x = <Row t={t} />;`,
	],
	[
		"t spread into props",
		`const t = useTranslations("A"); export const x = <Row {...{ t }} />;`,
	],
	[
		"a custom hook returning t",
		`export const useT = () => useTranslations("A");`,
	],
	[
		"a custom hook returning t from a block",
		`export function useT() { const t = useTranslations("A"); return t; }`,
	],
	[
		"t stored in an object",
		`const t = useTranslations("A"); export const ctx = { t };`,
	],
	[
		"t stored in an array",
		`const t = useTranslations("A"); const all = [t]; all[0]("x");`,
	],
	[
		"t assigned to a member",
		`const t = useTranslations("A"); globalThis.t = t;`,
	],
	["t destructured", `const { rich } = useTranslations("A"); rich("x");`],
	[
		"t destructured by assignment",
		`let rich; ({ rich } = useTranslations("A")); rich("x");`,
	],
	["t.call", `const t = useTranslations("A"); t.call(null, "x");`],
	["t.apply", `const t = useTranslations("A"); t.apply(null, ["x"]);`],
	["t.bind", `const t = useTranslations("A"); t.bind(null)("x");`],
	[
		"a translator method passed on",
		`const t = useTranslations("A"); use(t.rich);`,
	],
	[
		"t in a template",
		`const t = useTranslations("A"); console.log(\`\${t}\`);`,
	],
	["t as a tag", `const t = useTranslations("A"); t\`x\`;`],
	[
		"t as a component",
		`const T = useTranslations("A"); export const x = <T />;`,
	],
	[
		"an exported translator",
		`export const t = await getTranslations("A"); t("x");`,
	],
	[
		"an exported translator by name",
		`const t = await getTranslations("A"); export { t };`,
	],
	[
		"a default-exported translator",
		`const t = await getTranslations("A"); export default t;`,
	],
	["a promise without await", `getTranslations("A").then((t) => t("x"));`],
	[
		"promises collected",
		`const [a, b] = await Promise.all([getTranslations("A"), getTranslations("B")]);`,
	],
	["useTranslations passed on", `export const hooks = { useTranslations };`],
	["useTranslations re-exported", `export { useTranslations };`],
	["a re-export of next-intl", `export { useTranslations } from "next-intl";`],
	[
		"a renamed re-export of next-intl",
		`export { getTranslations as t } from "next-intl/server";`,
	],
	["export * from next-intl", `export * from "next-intl";`],
	["export * as from next-intl", `export * as intl from "next-intl";`],
	[
		"the next-intl module passed on",
		`import * as all from "next-intl"; use(all);`,
	],
	[
		"the next-intl module indexed",
		`import * as all from "next-intl"; all[window.name]("A");`,
	],
	[
		"the next-intl module destructured with a computed key",
		`import * as all from "next-intl"; const { [window.name]: f } = all;`,
	],
	[
		"require of next-intl indexed",
		`const intl = require("next-intl"); intl[window.name]("A");`,
	],
	[
		"useExtracted",
		`import { useExtracted } from "next-intl"; const t = useExtracted(); t("Hello");`,
	],
	[
		"getExtracted",
		`import { getExtracted } from "next-intl/server"; const t = await getExtracted(); t("Hello");`,
	],
	// the catalog
	[
		"useMessages read",
		`const messages = useMessages(); export const x = messages.Home.title;`,
	],
	[
		"getMessages read",
		`const messages = await getMessages(); export const keys = Object.keys(messages);`,
	],
	[
		"messages passed to a custom provider",
		`const messages = await getMessages(); export const x = <Providers messages={messages} />;`,
	],
	[
		"messages picked for the provider",
		`const messages = useMessages(); export const x = <NextIntlClientProvider messages={pick(messages, "A")} />;`,
	],
	[
		"messages spread into props",
		`const messages = useMessages(); export const x = <NextIntlClientProvider {...messages} />;`,
	],
	[
		"an imported message file read",
		`import en from "../messages/en.json"; export const x = en.Home.title;`,
	],
	[
		"a message file imported by namespace",
		`import * as en from "../messages/en.json"; use(en);`,
	],
	[
		"a named import of a message file",
		`import { Home } from "../messages/en.json"; use(Home);`,
	],
	[
		"a dynamically imported message file read",
		`export const f = async (l) => (await import(\`../messages/\${l}.json\`)).default.Home;`,
	],
	[
		"messages in a non-config object",
		`export const f = async () => ({ messages: await getMessages() });`,
	],
	["messages re-exported", `export { default } from "../messages/en.json";`],
	[
		"require of a message file",
		`const en = require("../messages/en.json"); use(en.Home);`,
	],
	[
		"a message file fetched",
		`export const f = () => fetch("/messages/en.json");`,
	],
	[
		"a message file read by a computed path",
		`export const f = (l) => readFile(join("messages", l + ".json"));`,
	],
	[
		"a message file read by a template",
		`export const f = (l) => readFile(\`messages/\${l}.json\`);`,
	],
	["next-intl/config", `import config from "next-intl/config"; use(config);`],
	// subtree reads
	[
		"t.raw of a key that may be a namespace",
		`const t = useTranslations("Nav"); t.raw("links");`,
	],
	[
		"t.has of a key that may be a namespace",
		`const t = useTranslations(); t.has("Nav");`,
	],
	// types
	[
		"MessageKeys",
		`import type { MessageKeys, Messages } from "next-intl"; type K = MessageKeys<Messages, "Home">;`,
	],
	[
		"NamespaceKeys",
		`import { type NamespaceKeys } from "use-intl"; type K = NamespaceKeys<IntlMessages, "Home">;`,
	],
	[
		"a qualified MessageKeys",
		`import * as intl from "next-intl"; type K = intl.MessageKeys<any, any>;`,
	],
	[
		"an import type of MessageKeys",
		`type K = import("next-intl").MessageKeys<any, any>;`,
	],
	[
		"keyof typeof messages",
		`import en from "../messages/en.json"; type K = keyof typeof en;`,
	],
	[
		"typeof a message",
		`import en from "../messages/en.json"; type K = typeof en.Home.title;`,
	],
	[
		"an indexed message catalog",
		`import en from "../messages/en.json"; type K = (typeof en)["Home"];`,
	],
	[
		"keyof an imported message type",
		`type K = keyof typeof import("../messages/en.json");`,
	],
	// loaders and evaluation
	["eval", `const t = useTranslations("A"); eval("t('x')");`],
	["new Function", `new Function("return 1")();`],
	["require with a computed path", `const m = require(window.name);`],
	["require passed on", `use(require);`],
	[
		"require.context",
		`const all = require.context("../messages", true, /\\.json$/);`,
	],
	["import with a computed path", `export const f = (name) => import(name);`],
	["import.meta.glob", `const all = import.meta.glob("../messages/*.json");`],
	["webpack require", `__webpack_require__(1);`],
] as const;

test.each(incomplete)("withholds unused findings: %s", async (_, code) => {
	const result = await analyze(
		`import { useTranslations, useMessages, NextIntlClientProvider, createTranslator } from "next-intl";
import { getTranslations, getMessages } from "next-intl/server";
${code}`,
		"src/component.tsx"
	);
	expect(result.status).toBe("incomplete");
	expect(result.issues!.length).toBeGreaterThan(0);
	for (const issue of result.issues!) {
		expect(issue.path).toBe("src/component.tsx");
		expect(issue.start?.line).toBeGreaterThanOrEqual(3);
	}
});

test("a with statement in a CommonJS file is incomplete", async () => {
	const result = await analyze(
		`const t = require("next-intl").useTranslations("A"); with (obj) { t("x"); }`,
		"src/a.cjs"
	);
	expect(result.status).toBe("incomplete");
});

test("a used key is never reported unused through an alias of an escape", async () => {
	// the escape is the call argument; the direct call still counts
	const result = await analyze(`import { useTranslations } from "next-intl";
const t = useTranslations("A");
t("direct");
helper(t);`);
	expect(result.status).toBe("incomplete");
	expect(result.usedBundleIds).toEqual(["A.direct"]);
	expect(result.issues).toEqual([
		expect.objectContaining({
			start: { line: 4, column: 7 },
			end: { line: 4, column: 8 },
		}),
	]);
});

test("t.raw of a key that isn't translated elsewhere is located", async () => {
	const result = await analyzeUsage({
		files: [
			{
				path: "src/a.tsx",
				content: `import { useTranslations } from "next-intl";\nconst t = useTranslations("Nav");\nt.raw("links");`,
			},
			{
				path: "src/b.tsx",
				content: `import { useTranslations } from "next-intl";\nconst t = useTranslations("Nav");\nt.raw("home"); t("home");`,
			},
		],
		settings,
	});
	expect(result.usedBundleIds).toEqual(["Nav.links", "Nav.home"]);
	expect(result.issues).toEqual([
		{
			path: "src/a.tsx",
			reason:
				't.raw() can read a whole namespace; the messages under "Nav.links" can\'t be resolved.',
			start: { line: 3, column: 0 },
			end: { line: 3, column: 14 },
		},
	]);
});

test("unsupported formats, parse errors and limits are explicit", async () => {
	const result = await analyzeUsage({
		files: [
			{ path: "src/App.vue", content: "<template>{{ t('x') }}</template>" },
			{ path: "src/broken.ts", content: "const = ;" },
			{ path: "src/huge.ts", content: "x".repeat(2_000_001) },
		],
		settings,
	});
	expect(result.status).toBe("incomplete");
	expect(result.issues!.map((issue) => issue.path)).toEqual([
		"src/App.vue",
		"src/broken.ts",
		"src/huge.ts",
	]);
	const many = await analyzeUsage({
		files: Array.from({ length: 10_001 }, (_, index) => ({
			path: `src/${index}.ts`,
			content: "",
		})),
		settings,
	});
	expect(many.status).toBe("incomplete");
});

test("message files are recognized by the plugin's path pattern", async () => {
	const namespaced = {
		...settings,
		"plugin.inlang.nextIntl": {
			pathPattern: { Home: "./messages/{locale}/home.json" },
			sourceLanguageFilePath: "./resources/main.json",
		},
	};
	const read = async (source: string) =>
		(
			await analyzeUsage({
				files: [
					{
						path: "src/a.ts",
						content: `import m from "${source}"; export const x = m.a;`,
					},
				],
				settings: namespaced,
			})
		).status;
	expect(await read("../messages/de/home.json")).toBe("incomplete");
	expect(await read("@/messages/EN/home.json")).toBe("incomplete");
	expect(await read("../resources/main.json")).toBe("incomplete");
	expect(await read("../messages/de.json")).toBe("complete");
	expect(await read("../data/home.json")).toBe("complete");
	// without the plugin's settings, any JSON file can be a message file
	const unknown = await analyzeUsage({
		files: [
			{
				path: "src/a.ts",
				content: `import m from "./data.json"; export const x = m.a;`,
			},
		],
		settings: { baseLocale: "en", locales: ["en"], modules: [] },
	});
	expect(unknown.status).toBe("incomplete");
});
