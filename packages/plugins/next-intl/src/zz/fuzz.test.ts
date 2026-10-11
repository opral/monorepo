import { test } from "vitest";
import { IntlMessageFormat } from "intl-messageformat";
import { parse } from "@formatjs/icu-messageformat-parser";
import { importFiles } from "../import-export/importFiles.js";
import { exportFiles } from "../import-export/exportFiles.js";
async function imp(json: Record<string, unknown>) {
	const imported = await importFiles({ settings: {} as any, files: [{ locale: "en", content: new TextEncoder().encode(JSON.stringify(json)) }] });
	const messages = imported.messages.map((m, i) => ({ ...m, id: m.id ?? `m-${i}`, selectors: m.selectors ?? [] }));
	const variants = imported.variants.map((v, i) => ({ ...v, id: `v-${i}`, messageId: messages.find((m) => m.bundleId === v.messageBundleId && m.locale === v.messageLocale)!.id, matches: v.matches ?? [], pattern: v.pattern ?? [] }));
	return { bundles: imported.bundles, messages, variants };
}
async function exp(rows: any) {
	const files = await exportFiles({ settings: {} as any, ...rows } as any);
	return JSON.parse(new TextDecoder().decode(files[0]!.content));
}
function render(message: string, values: Record<string, unknown>) {
	try {
		const tags = Object.fromEntries(["b", "i"].map((t) => [t, (c: unknown[]) => `[${t}:${c.join("")}]`]));
		const r = new IntlMessageFormat(message, "en").format({ ...tags, ...values } as any);
		return Array.isArray(r) ? r.join("") : String(r);
	} catch (e: any) { return "ERR " + e.message; }
}
const vals: any[] = [];
for (const n of [0, 1, 2, 3, 7]) for (const g of ["a", "b", "z"]) for (const m of [1, 2]) vals.push({ n, g, m, x: "X", a: "A", d: new Date(Date.UTC(2026, 0, 2, 3)) });
let seed = Number(process.env.SEED ?? 1);
const rnd = () => { seed = (seed * 1103515245 + 12345) % 2147483648; return seed / 2147483648; };
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)]!;
function text(): string { let s = ""; const n = Math.floor(rnd() * 4); for (let i = 0; i < n; i++) s += pick(["a", " ", "'", "''", "'{'", "'}'", "'#'", "#", "'<b>'", "<", ">", "'<'", "}", "x'y", "'#", "'{a}'"]); return s; }
function msg(depth: number, inPlural: boolean): string {
	let s = ""; const n = 1 + Math.floor(rnd() * 3);
	for (let i = 0; i < n; i++) {
		const r = rnd();
		if (r < 0.25) s += process.env.SIMPLE ? pick(["a", " x "]) : text();
		else if (r < 0.35) s += pick(["{x}", "{n}", "{n, number}", "{m, number, percent}", "{d, time, h 'o''clock'}", "{d, date, ::yyyy'-'MM}"]);
		else if (r < 0.5 && inPlural) s += "#";
		else if (r < 0.6 && depth > 0) { const t = pick(["b", "i"]); s += `<${t}>${msg(depth - 1, inPlural)}</${t}>`; }
		else if (r < 0.8 && depth > 0) { const arg = pick(["n", "m"]); const off = rnd() < 0.2 ? " offset:1" : ""; const t = rnd() < 0.2 ? "selectordinal" : "plural"; const keys = t === "plural" ? ["=0", "=1", "one", "other"] : ["one", "two", "other"]; s += `{${arg}, ${t},${t === "plural" ? off : ""} ${keys.filter((k) => k === "other" || rnd() < 0.6).map((k) => `${k} {${msg(depth - 1, true)}}`).join(" ")}}`; }
		else if (depth > 0) { s += `{g, select, ${["a", "b", "other"].filter((k) => k === "other" || rnd() < 0.6).map((k) => `${k} {${msg(depth - 1, false)}}`).join(" ")}}`; }
	}
	return s;
}
test("fuzz", async () => {
	let ok = 0, invalid = 0; const problems = new Map<string, string>(); const counts = new Map<string, number>();
	for (let i = 0; i < Number(process.env.N ?? 2000); i++) {
		const src = msg(Number(process.env.DEPTH ?? 2), false);
		try { parse(src); } catch { invalid++; continue; }
		let out: string;
		try { out = (await exp(await imp({ k: src }))).k; await exp(await imp({ k: out })); }
		catch (e: any) { const k = "THROW " + e.message.slice(0, 40); problems.set(k, src); counts.set(k, (counts.get(k) ?? 0) + 1); continue; }
		const d = vals.find((v) => render(src, v) !== render(out, v));
		if (d) { if (!problems.has("RENDER") || src.length < problems.get("RENDER")!.split("\n")[0]!.length) problems.set("RENDER", `${src}\n   -> ${out}\n   ${JSON.stringify(d)}: ${render(src, d)} | ${render(out, d)}`); counts.set("RENDER", (counts.get("RENDER") ?? 0) + 1); continue; }
		ok++;
	}
	console.log({ ok, invalid }, [...counts]);
	for (const [k, v] of problems) console.log(k, "::", v);
}, 600000);
