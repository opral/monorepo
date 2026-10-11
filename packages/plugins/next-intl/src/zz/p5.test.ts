import { test } from "vitest";
import { importFiles } from "../import-export/importFiles.js";
import { exportFiles } from "../import-export/exportFiles.js";
const enc = (o: any) => new TextEncoder().encode(JSON.stringify(o));
async function load(files: Record<string, any>) {
	const imported = await importFiles({ settings: {} as any, files: Object.entries(files).map(([locale, json]) => ({ locale, content: enc(json) })) });
	const messages = imported.messages.map((m, i) => ({ ...m, id: m.id ?? `m-${i}`, selectors: m.selectors ?? [] }));
	const variants = imported.variants.map((v, i) => ({ ...v, id: `v-${i}`, messageId: messages.find((m) => m.bundleId === v.messageBundleId && m.locale === v.messageLocale)!.id, matches: v.matches ?? [], pattern: v.pattern ?? [] }));
	return { bundles: imported.bundles, messages, variants };
}
const dump = async (rows: any, files?: any) => (await exportFiles({ settings: {} as any, ...rows, files } as any)).map((f) => `${f.locale}: ${new TextDecoder().decode(f.content)}`).join("\n");
test("conflict", async () => {
	const rows = await load({ en: { a: { b: "B" } }, de: { a: "A" } });
	rows.messages.push({ id: "new-de", bundleId: "a.b", locale: "de", selectors: [] } as any);
	rows.variants.push({ id: "nv", messageId: "new-de", matches: [], pattern: [{ type: "text", value: "B-de" }] } as any);
	console.log("CONFLICT\n" + (await dump(rows)));
	// new message conflicting with root key of the same name
	const rows2 = await load({ en: { a: { x: "X" } } });
	rows2.bundles.push({ id: "a", declarations: [] } as any);
	rows2.messages.push({ id: "new-a", bundleId: "a", locale: "en", selectors: [] } as any);
	rows2.variants.push({ id: "nv2", messageId: "new-a", matches: [], pattern: [{ type: "text", value: "A" }] } as any);
	console.log("NEW-A\n" + (await dump(rows2)));
	// prototype keys
	const rows3 = await load({ en: { x: "X" } });
	for (const id of ["__proto__.polluted", "constructor.x", "toString", "a..b", ".lead", "trail."]) {
		rows3.bundles.push({ id, declarations: [] } as any);
		rows3.messages.push({ id: "n-" + id, bundleId: id, locale: "en", selectors: [] } as any);
		rows3.variants.push({ id: "v-" + id, messageId: "n-" + id, matches: [], pattern: [{ type: "text", value: id }] } as any);
	}
	console.log("PROTO\n" + (await dump(rows3)), ({} as any).polluted);
	const back = await load({ en: JSON.parse((await dump(rows3)).slice(4)) });
	console.log("PROTO reimport", back.messages.map((m) => m.bundleId));
});
