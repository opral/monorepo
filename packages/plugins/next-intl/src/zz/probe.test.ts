import { test } from "vitest";
import { IntlMessageFormat } from "intl-messageformat";
import { importFiles } from "../import-export/importFiles.js";
import { exportFiles } from "../import-export/exportFiles.js";

async function imp(json: Record<string, unknown>, locale = "en") {
	const imported = await importFiles({ settings: {} as any, files: [{ locale, content: new TextEncoder().encode(JSON.stringify(json)) }] });
	const messages = imported.messages.map((m, i) => ({ ...m, id: m.id ?? `m-${i}`, selectors: m.selectors ?? [] }));
	const variants = imported.variants.map((v, i) => ({ ...v, id: `v-${i}`, messageId: messages.find((m) => m.bundleId === v.messageBundleId && m.locale === v.messageLocale)!.id, matches: v.matches ?? [], pattern: v.pattern ?? [] }));
	return { bundles: imported.bundles, messages, variants };
}
async function exp(rows: any, locale = "en") {
	const files = await exportFiles({ settings: {} as any, ...rows } as any);
	return JSON.parse(new TextDecoder().decode(files.find((f) => f.locale === locale)!.content));
}
function render(message: string, values: Record<string, unknown>) {
	try {
	const tags = Object.fromEntries(["b", "i", "link", "p", "br"].map((t) => [t, (c: unknown[]) => `[${t}:${c.join("")}]`]));
	const r = new IntlMessageFormat(message, "en").format({ ...tags, ...values } as any);
	return Array.isArray(r) ? r.join("") : String(r);
	} catch (e: any) { return "ERR " + e.message; }
}
const vals: any[] = [];
for (const n of [0, 1, 2, 5]) for (const g of ["a", "b", "x"]) vals.push({ n, g, m: n + 1, d: new Date(Date.UTC(2026, 0, 2, 3)), x: "X" });

const cases: Record<string, string> = JSON.parse(process.env.CASES ?? "{}");

test("probe", async () => {
	for (const [k, src] of Object.entries(cases)) {
		let out: string;
		try {
			const rows = await imp({ k: src });
			out = (await exp(rows)).k;
			const rows2 = await imp({ k: out });
			const out2 = (await exp(rows2)).k;
			const diffs = vals.filter((v) => render(src, v) !== render(out, v)).slice(0, 2).map((v) => `${JSON.stringify(v)}: ${render(src, v)} | ${render(out, v)}`);
			console.log(`[${k}] ${src}\n   -> ${out}${out2 !== out ? `\n   ->2 ${out2}` : ""}${diffs.length ? "\n   RENDER DIFF " + diffs.join(" ;; ") : ""}`);
			if (process.env.SHOW) console.log(JSON.stringify(rows.variants.map((v) => [v.matches, v.pattern]), null, 0), JSON.stringify(rows.messages[0].selectors), JSON.stringify(rows.bundles[0].declarations));
		} catch (e: any) {
			console.log(`[${k}] ${src}\n   THROW ${e.message}`);
		}
	}
});
