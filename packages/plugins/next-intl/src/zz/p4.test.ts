import { test } from "vitest";
import { exportFiles } from "../import-export/exportFiles.js";
const enc = (o: any) => new TextEncoder().encode(JSON.stringify(o, null, 2));
test("legacy", async () => {
	const prev = { a: "it''s {name}", b: "'{name}'", c: "Hi" };
	const v = (name: string) => ({ type: "expression", arg: { type: "variable-reference", name } });
	const rows = {
		bundles: [{ id: "a", declarations: [] }, { id: "b", declarations: [] }, { id: "c", declarations: [] }],
		messages: ["a", "b", "c"].map((id) => ({ id: `m${id}`, bundleId: id, locale: "en", selectors: [] })),
		variants: [
			{ id: "va", messageId: "ma", matches: [], pattern: [{ type: "text", value: "it''s " }, v("name")] },
			{ id: "vb", messageId: "mb", matches: [], pattern: [{ type: "text", value: "'" }, v("name"), { type: "text", value: "'" }] },
			{ id: "vc", messageId: "mc", matches: [], pattern: [{ type: "text", value: "Hi!" }] },
		],
	};
	const files = await exportFiles({ settings: {} as any, ...(rows as any), files: [{ locale: "en", content: enc(prev), path: "/en.json", imported: true } as any] } as any);
	console.log(new TextDecoder().decode(files[0]!.content));
});
