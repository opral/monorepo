import { test, expect } from "vitest";
import { detectChanges } from "./detect-changes.js";
import { openLix } from "@lix-js/sdk";
import { plugin } from "./index.js";
import { parseMarkdown, AstSchemas } from "@opral/markdown-wc";
import type { Ast } from "@opral/markdown-wc";

const encode = (text: string) => new TextEncoder().encode(text);

async function seedMarkdownState(args: {
	lix: any;
	fileId: string;
	markdown: string;
	ids?: string[];
}) {
	const { lix, fileId, markdown, ids } = args;
	const ast = parseMarkdown(markdown) as Ast;
	const order: string[] = [];
	const vrow = (await lix.db
		.selectFrom("active_version")
		.select("version_id")
		.executeTakeFirst()) as any;
	const versionId = vrow?.version_id as any;

	// Build values array
	const values: any[] = [];
	for (let i = 0; i < (ast.children as any[]).length; i++) {
		const n: any = (ast.children as any[])[i];
		const id = ids?.[i] ?? `n${i + 1}`;
		n.data = { ...(n.data || {}), id };
		order.push(id);
		values.push({
			entity_id: id,
			schema_key: (AstSchemas.schemasByType as any)[n.type]["x-lix-key"],
			file_id: fileId,
			plugin_key: plugin.key,
			snapshot_content: n,
			schema_version: (AstSchemas.schemasByType as any)[n.type][
				"x-lix-version"
			],
			version_id: versionId,
		});
	}

	// Chunked batch insert to keep parameter counts safe
	const CHUNK = 200;
	for (let i = 0; i < values.length; i += CHUNK) {
		const slice = values.slice(i, i + CHUNK);
		await lix.db.insertInto("state_all").values(slice).execute();
	}

	await lix.db
		.insertInto("state_all")
		.values({
			entity_id: "root",
			schema_key: (AstSchemas.RootOrderSchema as any)["x-lix-key"],
			file_id: fileId,
			plugin_key: plugin.key,
			snapshot_content: { order },
			schema_version: (AstSchemas.RootOrderSchema as any)["x-lix-version"],
			version_id: versionId,
		})
		.execute();
}

// ===== Helpers for large-doc tests (deterministic) =====
function rng(seed: number) {
	// xorshift32
	let x = seed >>> 0;
	return () => {
		x ^= x << 13;
		x ^= x >>> 17;
		x ^= x << 5;
		return (x >>> 0) / 0xffffffff;
	};
}

function shuffle<T>(arr: T[], seed = 42): T[] {
	const r = rng(seed);
	const a = arr.slice();
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(r() * (i + 1));
		const tmp = a[i]!;
		a[i] = a[j]!;
		a[j] = tmp;
	}
	return a;
}
function makeBigDoc(n: number) {
	const paras = Array.from({ length: n }, (_, i) => `P${i + 1}`);
	const beforeIds = Array.from({ length: n }, (_, i) => `p${i + 1}`);
	return { paras, beforeIds, markdown: paras.join("\n\n") };
}
function applySmallEdits(paras: string[], count: number, seed = 7): string[] {
	const r = rng(seed);
	const n = paras.length;
	const idxs = new Set<number>();
	while (idxs.size < Math.min(count, n)) idxs.add(Math.floor(r() * n));
	const out = paras.slice();
	for (const i of idxs) out[i] = out[i] + " x"; // tiny additive edit
	return out;
}

test("it should not detect changes if the markdown file did not update", async () => {
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f1";
	const beforeMarkdown = `# Heading\n\nSome text.`;
	await seedMarkdownState({
		lix,
		fileId,
		markdown: beforeMarkdown,
		ids: ["h1", "p1"],
	});
	const after = encode(beforeMarkdown);

	const detectedChanges = detectChanges({
		lix,
		after: { id: fileId, path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toEqual([]);
});

test("it should detect a new node", async () => {
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f2";
	const beforeMarkdown = `# Heading\n\nSome text.`;
	const afterMarkdown = `# Heading\n\nSome text.\n\nNew paragraph.`;
	await seedMarkdownState({
		lix,
		fileId,
		markdown: beforeMarkdown,
		ids: ["h1", "p1"],
	});
	const detectedChanges = detectChanges({
		lix,
		after: {
			id: fileId,
			path: "x.md",
			data: encode(afterMarkdown),
			metadata: {},
		},
	});

	expect(detectedChanges.length).toBeGreaterThan(0);
	const addedNode = detectedChanges.find((c) => {
		const para =
			c.snapshot_content?.type === "paragraph" ? c.snapshot_content : undefined;
		return para?.children?.[0]?.value?.includes("New paragraph") ?? false;
	});
	expect(addedNode).toBeTruthy();
	expect(addedNode?.schema["x-lix-key"]).toBe(
		AstSchemas.schemasByType.paragraph!["x-lix-key"],
	);
});

test("it should detect an updated node", async () => {
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f3";
	const beforeMarkdown = `# Heading\n\nSome text.`;
	const afterMarkdown = `# Heading\n\nUpdated text.`;
	await seedMarkdownState({
		lix,
		fileId,
		markdown: beforeMarkdown,
		ids: ["h1", "p1"],
	});
	const detectedChanges = detectChanges({
		lix,
		after: {
			id: fileId,
			path: "x.md",
			data: encode(afterMarkdown),
			metadata: {},
		},
	});

	expect(detectedChanges.length).toBeGreaterThan(0);
	const updatedNode = detectedChanges.find((c) => c.entity_id === "p1");
	expect(updatedNode).toBeTruthy();
	expect(updatedNode?.schema["x-lix-key"]).toBe(
		AstSchemas.schemasByType.paragraph!["x-lix-key"],
	);
});

test("it should detect a deleted node", async () => {
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f4";
	const beforeMarkdown = `# Heading\n\nSome text.\n\nAnother paragraph.`;
	const afterMarkdown = `# Heading\n\nSome text.`;
	await seedMarkdownState({
		lix,
		fileId,
		markdown: beforeMarkdown,
		ids: ["h1", "p1", "p2"],
	});
	const detectedChanges = detectChanges({
		lix,
		after: {
			id: fileId,
			path: "x.md",
			data: encode(afterMarkdown),
			metadata: {},
		},
	});

	expect(detectedChanges.length).toBeGreaterThan(0);
	const deletedNode = detectedChanges.find((c) => c.entity_id === "p2");
	expect(deletedNode).toBeTruthy();
	expect(deletedNode?.snapshot_content).toBeNull();
});

test("it should detect node reordering", async () => {
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f5";
	const beforeMarkdown = `First paragraph\n\nSecond paragraph`;
	const afterMarkdown = `Second paragraph\n\nFirst paragraph`;
	await seedMarkdownState({
		lix,
		fileId,
		markdown: beforeMarkdown,
		ids: ["p1", "p2"],
	});
	const detectedChanges = detectChanges({
		lix,
		after: {
			id: fileId,
			path: "x.md",
			data: encode(afterMarkdown),
			metadata: {},
		},
	});

	const orderChange = detectedChanges.find((c) => c.entity_id === "root");
	expect(orderChange).toBeTruthy();
	expect(orderChange?.schema).toBe(AstSchemas.RootOrderSchema);
	expect((orderChange?.snapshot_content as { order: string[] })?.order).toEqual(
		["p2", "p1"],
	);
});

test("it should handle empty documents", async () => {
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f6";
	const detectedChanges = detectChanges({
		lix,
		after: {
			id: fileId,
			path: "x.md",
			data: encode("# New heading"),
			metadata: {},
		},
	});

	expect(detectedChanges.length).toBeGreaterThan(0);
	const addedNode = detectedChanges.find(
		(c) => c.snapshot_content?.type === "heading",
	);
	expect(addedNode).toBeTruthy();
});

test("preserves ID on paragraph edit (expected to fail with strict fingerprints)", async () => {
	const before = `# H\n\nSome text.`;
	const after = `# H\n\nUpdated text.`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f7";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["h1", "p1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});

	// Desired behavior: modification for entity p1
	const mod = changes.find((c) => c.entity_id === "p1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.children?.[0]?.value).toBe("Updated text.");
});

test("preserves IDs on reorder", async () => {
	const before = `First\n\nSecond`;
	const after = `Second\n\nFirst`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f8";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1", "p2"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect(root?.schema).toBe(AstSchemas.RootOrderSchema);
	expect((root!.snapshot_content as { order: string[] }).order).toEqual([
		"p2",
		"p1",
	]);
});

test("insert between preserves existing ids and mints new", async () => {
	const before = `A\n\nC`;
	const after = `A\n\nB\n\nC`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f9";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["pA", "pC"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(2);

	// No deletions of existing ids
	const deletions = changes.filter((c) => c.snapshot_content === null);
	expect(deletions.length).toBe(0);

	// A new paragraph was added with a new id
	const add = changes.find(
		(c) =>
			c.snapshot_content?.type === "paragraph" &&
			c.snapshot_content?.children?.[0]?.value === "B",
	);
	expect(add).toBeTruthy();
	expect(["pA", "pC"]).not.toContain(add!.entity_id);
});

test("delete emits deletion and preserves other ids", async () => {
	const before = `Keep me\n\nDelete me`;
	const after = `Keep me`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f10";
	await seedMarkdownState({
		lix,
		fileId,
		markdown: before,
		ids: ["keep", "del"],
	});
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});

	const deletion = changes.find((c) => c.entity_id === "del");
	expect(deletion).toBeTruthy();
	expect(deletion?.snapshot_content).toBeNull();
});

test("cross-type: do not map heading id to paragraph", async () => {
	const before = `# Heading`;
	const after = `Paragraph`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f11";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["h1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});

	// Expect heading deletion and new paragraph addition with a different id
	const del = changes.find(
		(c) => c.entity_id === "h1" && c.snapshot_content === null,
	);
	expect(del).toBeTruthy();
	const addPara = changes.find((c) => c.snapshot_content?.type === "paragraph");
	expect(addPara).toBeTruthy();
	expect(addPara!.entity_id).not.toBe("h1");
});

test("canonicalization stability: hard break form changes keep id (mod or noop)", async () => {
	const before = `line  \nbreak`; // two spaces + newline
	const after = `line\\\nbreak`; // backslash + newline
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f12";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});

	// Either no change or a modification for p1 is acceptable.
	const p1change = changes.find((c) => c.entity_id === "p1");
	if (p1change) {
		expect(p1change.snapshot_content?.type).toBe("paragraph");
	}
});

test("move section (heading + paragraph) preserves ids and updates root order", async () => {
	const before = `# A\n\nPara A\n\n# B\n\nPara B`;
	const after = `# B\n\nPara B\n\n# A\n\nPara A`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f13";
	await seedMarkdownState({
		lix,
		fileId,
		markdown: before,
		ids: ["hA", "pA", "hB", "pB"],
	});
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect(root?.schema).toBe(AstSchemas.RootOrderSchema);
	expect((root!.snapshot_content as { order: string[] }).order).toEqual([
		"hB",
		"pB",
		"hA",
		"pA",
	]);
});

test("duplicate paragraphs reorder is ambiguous: no root order change", async () => {
	const before = `Same\n\nSame`;
	const after = `Same\n\nSame`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f14";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1", "p2"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});

	const root = changes.find((c) => c.entity_id === "root");
	if (root) {
		expect((root.snapshot_content as { order: string[] }).order).toEqual([
			"p1",
			"p2",
		]);
	}
});

test("code → paragraph (cross-type) results in deletion+addition", async () => {
	const before = "```js\nconsole.log(1)\n```";
	const after = "console.log(1)";
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f15";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["code1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});

	const del = changes.find(
		(c) => c.entity_id === "code1" && c.snapshot_content === null,
	);
	expect(del).toBeTruthy();
	const addPara = changes.find((c) => c.snapshot_content?.type === "paragraph");
	expect(addPara).toBeTruthy();
});

test("heading text edit preserves id", async () => {
	const before = `# Hello`;
	const after = `# Hello World`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f16";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["h1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "h1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("heading");
});

test("long document: insert 1, delete 1, reorder 2 (sanity)", async () => {
	const paras = Array.from({ length: 10 }, (_, i) => `P${i + 1}`);
	const before = paras.join("\n\n");
	const beforeIds = paras.map((_, i) => `p${i + 1}`);
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f17";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: beforeIds });

	// After: delete P3, insert PX after P5, reorder P1 and P2
	const afterParas = ["P2", "P1", "P4", "P5", "PX", "P6", ...paras.slice(6)];
	const after = afterParas.join("\n\n");

	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});

	const deletions = changes.filter((c) => c.snapshot_content === null);
	expect(deletions.length).toBe(1);
	const additions = changes.filter(
		(c) =>
			c.snapshot_content?.type === "paragraph" &&
			c.snapshot_content?.children?.[0]?.value === "PX",
	);
	expect(additions.length).toBe(1);

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	const order = (root!.snapshot_content as { order: string[] })
		.order as string[];
	expect(order.length).toBe(afterParas.length);
});

test("table cell edit preserves table id", async () => {
	const before = `| a | b |\n| - | - |\n| 1 | 2 |`;
	const after = `| a | b |\n| - | - |\n| 1 | 3 |`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f18";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["t1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	// Desired: single modification for entity t1
	const mod = changes.find((c) => c.entity_id === "t1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("table");
	const rows = (mod?.snapshot_content as { children?: any[] })?.children || [];
	const lastRowCells = rows[1]?.children || [];
	expect(lastRowCells[1]?.children?.[0]?.value).toBe("3");
});

test("duplicate paragraphs: edit the 2nd, keep p2 and no root change", async () => {
	const before = `Same\n\nSame`;
	const after = `Same\n\nSame updated.`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f19";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1", "p2"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	// p2 should be modified with updated content
	const mod = changes.find((c) => c.entity_id === "p2");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("paragraph");
	const text = mod?.snapshot_content?.children?.[0]?.value;
	expect(text).toContain("Same updated");

	// p1 should not be deleted
	const delP1 = changes.find(
		(c) => c.entity_id === "p1" && c.snapshot_content === null,
	);
	expect(delP1).toBeUndefined();

	// No root order change (or unchanged if present)
	const root = changes.find((c) => c.entity_id === "root");
	if (root) {
		expect((root.snapshot_content as { order: string[] }).order).toEqual([
			"p1",
			"p2",
		]);
	}
});

test("insert duplicate paragraph identical to existing: new id minted", async () => {
	const before = `Same`;
	const after = `Same\n\nSame`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f20";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(2);

	// There must be an added paragraph with a fresh id (not p1)
	const added = changes.find(
		(c) => c.snapshot_content?.type === "paragraph" && c.entity_id !== "p1",
	);
	expect(added).toBeTruthy();

	// Root order should include p1 followed by the new id
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	const order = (root!.snapshot_content as { order: string[] })
		.order as string[];
	expect(order[0]).toBe("p1");
	expect(order[1]).toBe(added!.entity_id);
});

test("three identical paragraphs; edit the middle only", async () => {
	const before = `Same\n\nSame\n\nSame`;
	const after = `Same\n\nSame updated\n\nSame`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f21";
	await seedMarkdownState({
		lix,
		fileId,
		markdown: before,
		ids: ["p1", "p2", "p3"],
	});
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});

	// Only p2 should be modified
	const mod = changes.find((c) => c.entity_id === "p2");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("paragraph");
	const t = mod?.snapshot_content?.children?.[0]?.value as string;
	expect(t).toContain("Same updated");

	// No deletion of p1 or p3
	const delP1 = changes.find(
		(c) => c.entity_id === "p1" && c.snapshot_content === null,
	);
	const delP3 = changes.find(
		(c) => c.entity_id === "p3" && c.snapshot_content === null,
	);
	expect(delP1).toBeUndefined();
	expect(delP3).toBeUndefined();

	// Root order unchanged
	const root = changes.find((c) => c.entity_id === "root");
	if (root) {
		expect((root.snapshot_content as { order: string[] }).order).toEqual([
			"p1",
			"p2",
			"p3",
		]);
	}
});

test("move a paragraph and add one word (keep id and update order)", async () => {
	const before = `Alpha\n\nBeta`;
	const after = `Beta plus\n\nAlpha`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f27";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1", "p2"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});

	// p2 should be modified ("Beta plus")
	const mod = changes.find((c) => c.entity_id === "p2");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("paragraph");
	const t = mod?.snapshot_content?.children?.[0]?.value as string;
	expect(t).toContain("Beta plus");

	// Root order updated: p2 first, then p1
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root!.snapshot_content as { order: string[] }).order).toEqual([
		"p2",
		"p1",
	]);
});

test("move a section and tweak heading text slightly (ids preserved; heading modified; order updated)", async () => {
	const before = `# A\n\nPara A\n\n# B\n\nPara B`;
	const after = `# B plus\n\nPara B\n\n# A\n\nPara A`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f28";
	await seedMarkdownState({
		lix,
		fileId,
		markdown: before,
		ids: ["hA", "pA", "hB", "pB"],
	});
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});

	// Root order updated to B section first, then A
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root!.snapshot_content as { order: string[] }).order).toEqual([
		"hB",
		"pB",
		"hA",
		"pA",
	]);

	// Heading hB should be modified ("B plus") and keep id
	const modHB = changes.find((c) => c.entity_id === "hB");
	expect(modHB).toBeTruthy();
	expect(modHB?.snapshot_content?.type).toBe("heading");
	const headingTxt = modHB?.snapshot_content?.children?.[0]?.value as string;
	expect(headingTxt).toContain("B plus");

	// Body pB should keep id (no deletion). It's OK if it's unchanged and has no change record
	const delPB = changes.find(
		(c) => c.entity_id === "pB" && c.snapshot_content === null,
	);
	expect(delPB).toBeUndefined();
});

test("list item text change: only list block modified (id preserved)", async () => {
	const before = `- one\n- two`;
	const after = `- one\n- two changed`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f29";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["list1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});

	// Should emit a single list block modification for entity list1
	const mod = changes.find((c) => c.entity_id === "list1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("list");

	// Only list modification expected; no root order change emitted
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
	expect(changes.length).toBe(1);
});

test("reorder list items: single list modification and no root order change", async () => {
	const before = `- one\n- two\n- three`;
	const after = `- three\n- one\n- two`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f30";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["list1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	// List block should be modified and keep its id
	const mod = changes.find((c) => c.entity_id === "list1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("list");

	// Only list modification expected; no root order change emitted
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
	expect(changes.length).toBe(1);
});

test("add a list item: single list modification and no root order change", async () => {
	const before = `- one\n- two`;
	const after = `- one\n- two\n- three`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f31";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["list1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "list1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("list");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("remove a list item: single list modification and no root order change", async () => {
	const before = `- one\n- two\n- three`;
	const after = `- one\n- three`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f32";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["list1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "list1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("list");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("table: add a row: single table modification and no root order change", async () => {
	const before = `| a | b |\n| - | - |\n| 1 | 2 |`;
	const after = `| a | b |\n| - | - |\n| 1 | 2 |\n| 3 | 4 |`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f33";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["t1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "t1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("table");

	const rows = (mod?.snapshot_content as { children?: any[] })?.children || [];
	expect(rows.length).toBe(3); // header + 2 body rows
	const lastRowCells = rows[2]?.children || [];
	expect(lastRowCells[0]?.children?.[0]?.value).toBe("3");
	expect(lastRowCells[1]?.children?.[0]?.value).toBe("4");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("table: remove a row: single table modification and no root order change", async () => {
	const before = `| a | b |\n| - | - |\n| 1 | 2 |\n| 3 | 4 |`;
	const after = `| a | b |\n| - | - |\n| 1 | 2 |`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f34";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["t1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "t1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("table");

	const rows = (mod?.snapshot_content as { children?: any[] })?.children || [];
	expect(rows.length).toBe(2); // header + 1 body row
	const lastRowCells = rows[1]?.children || [];
	expect(lastRowCells[0]?.children?.[0]?.value).toBe("1");
	expect(lastRowCells[1]?.children?.[0]?.value).toBe("2");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("table: reorder rows: single table modification and no root order change", async () => {
	const before = `| a | b |\n| - | - |\n| 1 | 2 |\n| 3 | 4 |\n| 5 | 6 |`;
	const after = `| a | b |\n| - | - |\n| 3 | 4 |\n| 5 | 6 |\n| 1 | 2 |`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f35";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["t1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "t1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("table");

	const rows = (mod?.snapshot_content as { children?: any[] })?.children || [];
	expect(rows.length).toBe(4); // header + 3 body rows
	const r1 = rows[1]?.children || [];
	const r2 = rows[2]?.children || [];
	const r3 = rows[3]?.children || [];
	expect(r1[0]?.children?.[0]?.value).toBe("3");
	expect(r1[1]?.children?.[0]?.value).toBe("4");
	expect(r2[0]?.children?.[0]?.value).toBe("5");
	expect(r2[1]?.children?.[0]?.value).toBe("6");
	expect(r3[0]?.children?.[0]?.value).toBe("1");
	expect(r3[1]?.children?.[0]?.value).toBe("2");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("paragraph → blockquote (same text): deletion + addition + root order change", async () => {
	const before = `Hello`;
	const after = `> Hello`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f22";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(3);

	// Paragraph deleted
	const del = changes.find(
		(c) => c.entity_id === "p1" && c.snapshot_content === null,
	);
	expect(del).toBeTruthy();

	// Blockquote added with a new id
	const addBq = changes.find((c) => c.snapshot_content?.type === "blockquote");
	expect(addBq).toBeTruthy();
	expect(addBq!.entity_id).not.toBe("p1");

	// Root order updated to the new id
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root!.snapshot_content as { order: string[] }).order).toEqual([
		addBq!.entity_id,
	]);
});

test("paragraph → heading (same text): deletion + addition + root order change", async () => {
	const before = `Hello`;
	const after = `# Hello`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f23";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(3);

	// Paragraph deleted
	const del = changes.find(
		(c) => c.entity_id === "p1" && c.snapshot_content === null,
	);
	expect(del).toBeTruthy();

	// Heading added with a new id
	const addH = changes.find((c) => c.snapshot_content?.type === "heading");
	expect(addH).toBeTruthy();
	expect(addH!.entity_id).not.toBe("p1");

	// Root order updated to the new id
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root!.snapshot_content as { order: string[] }).order).toEqual([
		addH!.entity_id,
	]);
});

test('paragraph split ("AB" → "A" + "B"): first keeps id, second gets new id', async () => {
	const before = `AB`;
	const after = `A\n\nB`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f24";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(3);

	// p1 should be modified to "A"
	const mod = changes.find((c) => c.entity_id === "p1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("paragraph");
	const firstText = mod?.snapshot_content?.children?.[0]?.value as string;
	expect(firstText).toBe("A");

	// A new paragraph "B" with a fresh id
	const add = changes.find(
		(c) => c.snapshot_content?.type === "paragraph" && c.entity_id !== "p1",
	);
	expect(add).toBeTruthy();
	const secondText = add?.snapshot_content?.children?.[0]?.value as string;
	expect(secondText).toBe("B");

	// Root order becomes [p1, newId]
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root!.snapshot_content as { order: string[] }).order).toEqual([
		"p1",
		add!.entity_id,
	]);
});

test('paragraph merge ("A" + "B" → "AB"): first keeps id (modified), second deleted', async () => {
	const before = `A\n\nB`;
	const after = `AB`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f25";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1", "p2"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(3);

	// p1 should be modified to "AB"
	const mod = changes.find((c) => c.entity_id === "p1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("paragraph");
	const text = mod?.snapshot_content?.children?.[0]?.value as string;
	expect(text).toBe("AB");

	// p2 deleted
	const del = changes.find(
		(c) => c.entity_id === "p2" && c.snapshot_content === null,
	);
	expect(del).toBeTruthy();

	// Root order becomes [p1]
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root!.snapshot_content as { order: string[] }).order).toEqual(["p1"]);
});

test("CRLF ↔ LF normalization (entire file): no changes", async () => {
	const before = `Line A\r\n\r\nLine B`;
	const after = `Line A\n\nLine B`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f26";
	await seedMarkdownState({
		lix,
		fileId,
		markdown: before.replace(/\r\n/g, "\n"),
		ids: ["p1", "p2"],
	});
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(0);
});

test("hard break variants (spaces vs backslash, CRLF): same id, mod or noop", async () => {
	// Two spaces + CRLF indicates a hard break in Markdown
	const before = `line··\r\nbreak`;
	const after = `line\\\r\nbreak`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f49";
	await seedMarkdownState({
		lix,
		fileId,
		markdown: before.replace(/··/g, "  "),
		ids: ["p1"],
	});
	const changes = detectChanges({
		lix,
		after: {
			id: fileId,
			path: "/f.md",
			data: encode(after.replace(/··/g, "  ")),
			metadata: {},
		},
	});
	// Either no change or a single modification for p1, but never a new id
	expect([0, 1]).toContain(changes.length);
	const newIds = changes.filter(
		(c) => c.entity_id !== "p1" && c.snapshot_content?.type === "paragraph",
	);
	expect(newIds.length).toBe(0);
});

test("code block: edit content, same lang → keep id; single modification", async () => {
	const before = "```js\nconsole.log(1)\n```";
	const after = "```js\nconsole.log(2)\n```";
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f50";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["code1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "code1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("code");
	const lang = mod?.snapshot_content?.lang ?? null;
	expect(lang).toBe("js");
	const value = mod?.snapshot_content?.value as string;
	expect(value).toContain("console.log(2)");
});

test("code block: change lang only → same id; single modification", async () => {
	const before = "```js\nconsole.log(1)\n```";
	const after = "```ts\nconsole.log(1)\n```";
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f36";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["code1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "code1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("code");
	const lang = mod?.snapshot_content?.lang ?? null;
	expect(lang).toBe("ts");
	const value = mod?.snapshot_content?.value as string;
	expect(value).toContain("console.log(1)");
});

test("code block: backtick fence length 3 ↔ 4 → same id; mod or noop", async () => {
	const before = "```js\nconsole.log(1)\n```";
	const after = "````js\nconsole.log(1)\n````";
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f37";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["code1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	// Canonical serializer should normalize either way; allow 0 or 1 change but never a new id
	expect([0, 1]).toContain(changes.length);
	const add = changes.find(
		(c) => c.snapshot_content?.type === "code" && c.entity_id !== "code1",
	);
	expect(add).toBeUndefined();
});

test("paragraph with link: change link text only → same paragraph id; single modification", async () => {
	const before = `[text](https://example.com)`;
	const after = `[new](https://example.com)`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f38";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "p1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("paragraph");

	const para = mod?.snapshot_content as { children?: any[] };
	const link = (para.children || []).find((n: any) => n.type === "link");
	expect(link?.url).toBe("https://example.com");
	const linkText = link?.children?.[0]?.value;
	expect(linkText).toBe("new");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("paragraph with link: change only the url → same paragraph id; single modification", async () => {
	const before = `[text](https://example.com)`;
	const after = `[text](https://example.org)`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f39";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "p1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("paragraph");

	const para = mod?.snapshot_content as { children?: any[] };
	const link = (para.children || []).find((n: any) => n.type === "link");
	expect(link?.url).toBe("https://example.org");
	const linkText = link?.children?.[0]?.value;
	expect(linkText).toBe("text");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("top-level html node: text tweak → same id; single modification", async () => {
	const before = `<div>Hello</div>`;
	const after = `<div>Hello world</div>`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f40";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["h1"] });
	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "h1");
	expect(mod).toBeTruthy();
	expect(mod?.snapshot_content?.type).toBe("html");
	const value = mod?.snapshot_content?.value as string;
	expect(value).toContain("Hello world");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test.todo(
	"custom element html: add top-level element → addition + root order change",
	async () => {
		const before = ``;
		const after = `<doc-figure src="/img.png" caption="Hello" />`;
		const lix = await openLix({ providePlugins: [plugin] });
		const fileId = "f41";
		await seedMarkdownState({ lix, fileId, markdown: before, ids: [] });

		const changes = detectChanges({
			lix,
			after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
		});
		expect(changes).toHaveLength(2);

		const add = changes.find((c) => c.snapshot_content?.type === "html");
		expect(add).toBeTruthy();
		const value = add?.snapshot_content?.value as string;
		expect(value).toContain("doc-figure");

		const root = changes.find((c) => c.entity_id === "root");
		expect(root).toBeTruthy();
		expect(
			((root!.snapshot_content as { order: string[] }).order as string[])[0],
		).toBe(add!.entity_id);
	},
);

test.todo(
	"custom element html: delete top-level element → deletion + root order change",
	async () => {
		const before = `<doc-figure src="/img.png" caption="Hello" />`;
		const after = ``;
		const lix = await openLix({ providePlugins: [plugin] });
		const fileId = "f42";
		await seedMarkdownState({ lix, fileId, markdown: before, ids: ["html1"] });

		const changes = detectChanges({
			lix,
			after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
		});
		expect(changes).toHaveLength(2);

		const del = changes.find((c) => c.entity_id === "html1");
		expect(del).toBeTruthy();
		expect(del!.snapshot_content).toBeNull();

		const root = changes.find((c) => c.entity_id === "root");
		expect(root).toBeTruthy();
		expect(
			(root!.snapshot_content as { order: string[] }).order as string[],
		).toEqual([]);
	},
);

test("Unicode NFC vs NFD accents: normalize and keep id (no extra change)", async () => {
	// Café (NFC) vs Cafe + combining acute (NFD)
	const nfc = "Caf\u00E9";
	const nfd = "Cafe\u0301";
	const before = `${nfc}`;
	const after = `${nfd}`;
	const lix = await openLix({ providePlugins: [plugin] });
	const fileId = "f43";
	await seedMarkdownState({ lix, fileId, markdown: before, ids: ["p1"] });

	const changes = detectChanges({
		lix,
		after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
	});
	// Ideal: canonicalization eliminates differences => 0 or a single mod to same id
	expect([0, 1]).toContain(changes.length);
	const foreignParagraph = changes.find(
		(c) => c.snapshot_content?.type === "paragraph" && c.entity_id !== "p1",
	);
	expect(foreignParagraph).toBeUndefined();
});

test(
	"large doc (500 paras): delete 1, insert 1, move 10 → 3 changes",
	{ timeout: 30000 },
	async () => {
		// Build 500 paragraphs via for-loop
		const paras: string[] = [];
		const beforeIds: string[] = [];
		for (let i = 1; i <= 500; i++) {
			paras.push(`P${i}`);
			beforeIds.push(`p${i}`);
		}
		const before = paras.join("\n\n");
		const lix = await openLix({ providePlugins: [plugin] });
		const fileId = "f44";
		await seedMarkdownState({ lix, fileId, markdown: before, ids: beforeIds });

		// After: move P451..P460 to the front, delete P500, insert PX after P300
		const moved = paras.slice(450, 460); // P451..P460
		const remaining = paras.slice(0, 450).concat(paras.slice(460)); // exclude moved
		const remainingNoP500 = remaining.filter((s) => s !== "P500");
		const idxP300 = remainingNoP500.indexOf("P300");
		const afterParas = [
			...moved,
			...remainingNoP500.slice(0, idxP300 + 1),
			"PX",
			...remainingNoP500.slice(idxP300 + 1),
		];
		const after = afterParas.join("\n\n");

		const changes = detectChanges({
			lix,
			after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
		});

		// One deletion (p500)
		const del = changes.find((c) => c.entity_id === "p500");
		expect(del).toBeTruthy();
		expect(del!.snapshot_content).toBeNull();

		// One addition (PX)
		const add = changes.find(
			(c) =>
				c.snapshot_content?.type === "paragraph" &&
				c.snapshot_content?.children?.[0]?.value === "PX",
		);
		expect(add).toBeTruthy();
		expect(beforeIds).not.toContain(add!.entity_id);

		// Root order updated with length 500
		const root = changes.find((c) => c.entity_id === "root");
		expect(root).toBeTruthy();
		const order = (root!.snapshot_content as { order: string[] })
			.order as string[];
		expect(order.length).toBe(500);

		// Starts with moved ids p451..p460
		const expectedStart = Array.from({ length: 10 }, (_, i) => `p${451 + i}`);
		expect(order.slice(0, 10)).toEqual(expectedStart);

		// p500 not in order; PX appears right after p300
		expect(order).not.toContain("p500");
		const addedId = add!.entity_id;
		const idx300 = order.indexOf("p300");
		expect(idx300).toBeGreaterThanOrEqual(0);
		expect(order[idx300 + 1]).toBe(addedId);
	},
);

test(
	"large doc (500): pure shuffle → root change only",
	{ timeout: 30000 },
	async () => {
		const { paras, beforeIds, markdown } = makeBigDoc(500);
		const lix = await openLix({ providePlugins: [plugin] });
		const fileId = "f45";
		await seedMarkdownState({ lix, fileId, markdown, ids: beforeIds });
		const after = shuffle(paras, 123).join("\n\n");

		const changes = detectChanges({
			lix,
			after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
		});

		// Expect ONLY a root order change
		const dels = changes.filter((c) => c.snapshot_content === null);
		const adds = changes.filter((c) => c.snapshot_content?.type);
		expect(dels.length).toBe(0);
		expect(adds.length).toBe(0);

		const root = changes.find((c) => c.entity_id === "root");
		expect(root).toBeTruthy();
		const order = (root!.snapshot_content as { order: string[] })
			.order as string[];
		expect(order.length).toBe(500);
	},
);

test(
	"large doc (500): ~1% tiny edits → equal number of mods, no adds/dels",
	{ timeout: 30000 },
	async () => {
		const { paras, beforeIds, markdown } = makeBigDoc(500);
		const lix = await openLix({ providePlugins: [plugin] });
		const fileId = "f46";
		await seedMarkdownState({ lix, fileId, markdown, ids: beforeIds });

		const edited = applySmallEdits(paras, Math.floor(paras.length * 0.01), 99);
		const after = edited.join("\n\n");

		const changes = detectChanges({
			lix,
			after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
		});

		const dels = changes.filter((c) => c.snapshot_content === null);
		const adds = changes.filter(
			(c) =>
				c.snapshot_content?.type &&
				c.entity_id &&
				!beforeIds.includes(c.entity_id),
		);
		const mods = changes.filter(
			(c) => c.snapshot_content?.type && beforeIds.includes(c.entity_id),
		);
		expect(dels.length).toBe(0);
		expect(adds.length).toBe(0);
		expect(mods.length).toBeGreaterThan(0);
		// Allow a little slack but expect close to 1% (±2)
		expect(
			Math.abs(mods.length - Math.floor(paras.length * 0.01)),
		).toBeLessThanOrEqual(2);
	},
);

test(
	"duplicates (500 Same): edit #350 only → 1 mod, no root change",
	{ timeout: 30000 },
	async () => {
		const paras = Array.from({ length: 500 }, () => "Same");
		const beforeIds = Array.from({ length: 500 }, (_, i) => `p${i + 1}`);
		const before = paras.join("\n\n");
		const lix = await openLix({ providePlugins: [plugin] });
		const fileId = "f47";
		await seedMarkdownState({ lix, fileId, markdown: before, ids: beforeIds });

		const afterParas = paras.slice();
		afterParas[349] = "Same updated";
		const after = afterParas.join("\n\n");

		const changes = detectChanges({
			lix,
			after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
		});

		const mods = changes.filter(
			(c) => c.snapshot_content?.type === "paragraph",
		);
		expect(mods.length).toBe(1);
		expect(mods[0]!.entity_id).toBe("p350");

		const root = changes.find((c) => c.entity_id === "root");
		if (root) {
			expect((root.snapshot_content as { order: string[] }).order).toEqual(
				beforeIds,
			); // order stable
		}
	},
);

test(
	"large mixed (500): 300 dup 'Same' + move 200 unique → 1 root + targeted mods",
	{ timeout: 30000 },
	async () => {
		// Build 300 'Same' + 200 unique tail (total 500)
		const dups = Array.from({ length: 300 }, () => "Same");
		const uniques = Array.from({ length: 200 }, (_, i) => `U${i + 1}`);
		const paras = [...dups, ...uniques];
		const beforeIds = Array.from(
			{ length: paras.length },
			(_, i) => `p${i + 1}`,
		);
		const before = paras.join("\n\n");
		const lix = await openLix({ providePlugins: [plugin] });
		const fileId = "f48";
		await seedMarkdownState({ lix, fileId, markdown: before, ids: beforeIds });

		// Move the last 200 uniques to the front; edit U10 slightly
		const moved = uniques.slice();
		const remaining = dups.slice();
		const editedMoved = moved.slice();
		editedMoved[9] = editedMoved[9] + " x";
		const after = [...editedMoved, ...remaining].join("\n\n");

		const changes = detectChanges({
			lix,
			after: { id: fileId, path: "/f.md", data: encode(after), metadata: {} },
		});

		// Expect one root, plus exactly one mod (U10), no adds/dels
		const root = changes.find((c) => c.entity_id === "root");
		expect(root).toBeTruthy();

		const dels = changes.filter((c) => c.snapshot_content === null);
		const adds = changes.filter(
			(c) => c.snapshot_content?.type && !beforeIds.includes(c.entity_id),
		);
		const mods = changes.filter(
			(c) => c.snapshot_content?.type && beforeIds.includes(c.entity_id),
		);
		expect(dels.length).toBe(0);
		expect(adds.length).toBe(0);
		expect(mods.length).toBe(1);
	},
);
