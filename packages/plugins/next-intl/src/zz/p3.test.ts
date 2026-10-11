import { test } from "vitest";
import { IntlMessageFormat } from "intl-messageformat";
import { serializeNextIntlMessage } from "../import-export/icu.js";
const pound = (offset?: string) => ({ type: "expression", arg: { type: "variable-reference", name: "n" }, annotation: { type: "function-reference", name: "icu:pound", options: offset ? [{ name: "offset", value: { type: "literal", value: offset } }] : [] } });
const v = (name: string) => ({ type: "expression", arg: { type: "variable-reference", name } });
const t = (value: string) => ({ type: "text", value });
const pluralDecl = { type: "local-variable", name: "nPlural", value: { type: "expression", arg: { type: "variable-reference", name: "n" }, annotation: { type: "function-reference", name: "plural", options: [] } } };
function run(label: string, bundleDecls: any[], selectors: string[], variants: Array<[any[], any[]]>, vals: any[] = []) {
	try {
		const out = serializeNextIntlMessage({
			bundle: { id: "b", declarations: bundleDecls } as any,
			message: { id: "m", bundleId: "b", locale: "en", selectors: selectors.map((name) => ({ type: "variable-reference", name })) } as any,
			variants: variants.map(([matches, pattern], i) => ({ id: `v${i}`, messageId: "m", matches, pattern })) as any,
		});
		const renders = vals.map((val) => { try { const r = new IntlMessageFormat(out, "en").format({ b: (c: any[]) => `[b:${c.join("")}]`, ...val }); return Array.isArray(r) ? r.join("") : r; } catch (e: any) { return "ERR " + e.message; } });
		console.log(`[${label}] ${out}  ${renders.join(" | ")}`);
	} catch (e: any) { console.log(`[${label}] THROW ${e.message}`); }
}
const lit = (key: string, value: string) => ({ type: "literal-match", key, value });
const all = (key: string) => ({ type: "catchall-match", key });
test("x", () => {
	const decls = [{ type: "input-variable", name: "n" }, { type: "input-variable", name: "g" }, pluralDecl];
	run("pound-in-select-in-plural", decls, ["nPlural", "g"], [
		[[lit("nPlural", "one"), lit("g", "a")], [pound(), t(" A")]],
		[[lit("nPlural", "one"), all("g")], [pound(), t(" O")]],
		[[all("nPlural"), lit("g", "a")], [pound(), t(" As")]],
		[[all("nPlural"), all("g")], [pound(), t(" Os")]],
	], [{ n: 1, g: "a" }, { n: 5, g: "x" }]);
	run("pound-outside-plural", decls, [], [[[], [t("n="), pound()]]], [{ n: 3 }]);
	run("pound-offset-outside", decls, [], [[[], [t("n="), pound("1")]]], [{ n: 3 }]);
	run("select-only-pound", decls, ["g"], [[[lit("g", "a")], [pound()]], [[all("g")], [t("x")]]], [{ n: 3, g: "a" }]);
	run("var-with-space", [{ type: "input-variable", name: "user name" }], [], [[[], [t("Hi "), v("user name")]]]);
	run("var-with-dot-and-selector", [{ type: "input-variable", name: "user.name" }, { type: "input-variable", name: "g" }], ["g"], [[[lit("g", "a")], [v("user.name")]], [[all("g")], [t("x")]]]);
	run("var-dash", [{ type: "input-variable", name: "first-name" }], [], [[[], [v("first-name")]]]);
	run("literal-arg", [], [], [[[], [{ type: "expression", arg: { type: "literal", value: "lit" } }]]]);
	run("markup-standalone", [], [], [[[], [t("a"), { type: "markup-standalone", name: "br" }, t("b")]]], [{ br: () => "<BR>" }]);
	run("markup-unbalanced", [], [], [[[], [t("a"), { type: "markup-start", name: "b" }, t("b")]]]);
	run("markup-name-bad", [], [], [[[], [{ type: "markup-start", name: "my tag" }, t("b"), { type: "markup-end", name: "my tag" }]]]);
	run("unknown-fn", [{ type: "input-variable", name: "d" }], [], [[[], [{ type: "expression", arg: { type: "variable-reference", name: "d" }, annotation: { type: "function-reference", name: "datetime", options: [{ name: "dateStyle", value: { type: "literal", value: "short" } }] } }]]]);
	run("empty-pattern", [], [], [[[], []]]);
	run("text-only-apos-end-before-tag", [], [], [[[], [t("Don'"), { type: "markup-start", name: "b" }, t("x'"), { type: "markup-end", name: "b" }, t("'")]]], [{}]);
	run("text-hash-top", [], [], [[[], [t("#1 {x} <b>")]]], [{}]);
	run("selector-no-catchall", decls, ["g"], [[[lit("g", "a")], [t("A")]]], [{ g: "a" }, { g: "z" }]);
	run("selector-var-undeclared-select", [{ type: "input-variable", name: "g" }], ["g"], [[[lit("g", "a")], [t("A")]], [[all("g")], [t("O")]]], [{ g: "a" }]);
	run("plural-cat-on-input-var", [{ type: "input-variable", name: "n" }], ["n"], [[[lit("n", "one")], [t("one")]], [[all("n")], [t("other")]]], [{ n: 1 }]);
	run("plural-key-weird", decls, ["nPlural"], [[[lit("nPlural", "=1")], [t("x")]], [[lit("nPlural", "one ")], [t("y")]], [[all("nPlural")], [t("o")]]], [{ n: 1 }]);
	run("select-key-with-space", decls, ["g"], [[[lit("g", "a b")], [t("x")]], [[all("g")], [t("o")]]], [{ g: "a b" }]);
	run("select-key-with-brace", decls, ["g"], [[[lit("g", "a}")], [t("x")]], [[all("g")], [t("o")]]], [{ g: "a}" }]);
});
