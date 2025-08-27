import { test, expect } from "vitest";
import { detectChanges } from "./detect-changes.js";
import { parseMarkdown, AstSchemas, serializeAst } from "@opral/markdown-wc";
import { MarkdownRootSchemaV1 } from "./schemas/root.js";

const encode = (text: string) => new TextEncoder().encode(text);

function makeBeforeState(markdown: string, ids?: string[]) {
	const ast = parseMarkdown(markdown) as any;
	const created_at = new Date().toISOString();
	const rows: any[] = [];
	const order: string[] = [];
	ast.children.forEach((n: any, i: number) => {
		const id = ids?.[i] ?? `n${i + 1}`;
		n.data = { ...(n.data ?? {}), id };
		order.push(id);
		rows.push({
			entity_id: id,
			schema_key: (AstSchemas.schemasByType as any)[n.type]["x-lix-key"],
			snapshot_content: n,
			created_at,
		});
	});
	rows.push({
		entity_id: "root",
		schema_key: MarkdownRootSchemaV1["x-lix-key"],
		snapshot_content: { order },
		created_at,
	});
	return rows;
}

// ===== Helpers for large-doc tests (deterministic) =====
function rng(seed: number) {
  // xorshift32
  let x = seed >>> 0;
  return () => {
    x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
    return (x >>> 0) / 0xffffffff;
  };
}

function shuffle<T>(arr: T[], seed = 42): T[] {
  const r = rng(seed);
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i] as any, a[j] as any] = [a[j], a[i]];
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
	const beforeMarkdown = `# Heading\n\nSome text.`;
	const beforeState = makeBeforeState(beforeMarkdown, ["h1", "p1"]);
	const after = encode(beforeMarkdown);

	const detectedChanges = detectChanges({
		beforeState,
		after: { id: "random", path: "x.md", data: after, metadata: {} },
	});

	expect(detectedChanges).toEqual([]);
});

test("it should detect a new node", async () => {
	const beforeMarkdown = `# Heading\n\nSome text.`;
	const afterMarkdown = `# Heading\n\nSome text.\n\nNew paragraph.`;
	const beforeState = makeBeforeState(beforeMarkdown, ["h1", "p1"]);
	const detectedChanges = detectChanges({
		beforeState,
		after: {
			id: "random",
			path: "x.md",
			data: encode(afterMarkdown),
			metadata: {},
		},
	});

	expect(detectedChanges.length).toBeGreaterThan(0);
	const addedNode = detectedChanges.find(
		(c) =>
			(c.snapshot_content as any)?.type === "paragraph" &&
			(c.snapshot_content as any)?.children?.[0]?.value?.includes(
				"New paragraph",
			),
	);
	expect(addedNode).toBeTruthy();
	expect((addedNode as any).schema["x-lix-key"]).toBe(
		(AstSchemas.schemasByType as any).paragraph["x-lix-key"],
	);
});

test("it should detect an updated node", async () => {
	const beforeMarkdown = `# Heading\n\nSome text.`;
	const afterMarkdown = `# Heading\n\nUpdated text.`;
	const beforeState = makeBeforeState(beforeMarkdown, ["h1", "p1"]);
	const detectedChanges = detectChanges({
		beforeState,
		after: {
			id: "random",
			path: "x.md",
			data: encode(afterMarkdown),
			metadata: {},
		},
	});

	expect(detectedChanges.length).toBeGreaterThan(0);
	const updatedNode = detectedChanges.find((c) => c.entity_id === "p1");
	expect(updatedNode).toBeTruthy();
	expect((updatedNode as any).schema["x-lix-key"]).toBe(
		(AstSchemas.schemasByType as any).paragraph["x-lix-key"],
	);
});

test("it should detect a deleted node", async () => {
	const beforeMarkdown = `# Heading\n\nSome text.\n\nAnother paragraph.`;
	const afterMarkdown = `# Heading\n\nSome text.`;
	const beforeState = makeBeforeState(beforeMarkdown, ["h1", "p1", "p2"]);
	const detectedChanges = detectChanges({
		beforeState,
		after: {
			id: "random",
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
	const beforeMarkdown = `First paragraph\n\nSecond paragraph`;
	const afterMarkdown = `Second paragraph\n\nFirst paragraph`;
	const beforeState = makeBeforeState(beforeMarkdown, ["p1", "p2"]);
	const detectedChanges = detectChanges({
		beforeState,
		after: {
			id: "random",
			path: "x.md",
			data: encode(afterMarkdown),
			metadata: {},
		},
	});

	const orderChange = detectedChanges.find((c) => c.entity_id === "root");
	expect(orderChange).toBeTruthy();
	expect(orderChange?.schema).toBe(MarkdownRootSchemaV1);
	expect((orderChange?.snapshot_content as any)?.order).toEqual(["p2", "p1"]);
});

test("it should handle empty documents", async () => {
	const detectedChanges = detectChanges({
		beforeState: [],
		after: {
			id: "random",
			path: "x.md",
			data: encode("# New heading"),
			metadata: {},
		},
	});

	expect(detectedChanges.length).toBeGreaterThan(0);
	const addedNode = detectedChanges.find(
		(c) => (c.snapshot_content as any)?.type === "heading",
	);
	expect(addedNode).toBeTruthy();
});

test("preserves ID on paragraph edit (expected to fail with strict fingerprints)", () => {
	const before = `# H\n\nSome text.`;
	const after = `# H\n\nUpdated text.`;

	const beforeState = makeBeforeState(before, ["h1", "p1"]);
	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	// Desired behavior: modification for entity p1
	const mod = changes.find((c) => c.entity_id === "p1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.children?.[0]?.value).toBe(
		"Updated text.",
	);
});

test("preserves IDs on reorder", () => {
	const before = `First\n\nSecond`;
	const after = `Second\n\nFirst`;
	const beforeState = makeBeforeState(before, ["p1", "p2"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const root = changes.find((c) => c.entity_id === "root");
	expect(root?.schema).toBe(MarkdownRootSchemaV1);
	expect((root?.snapshot_content as any).order).toEqual(["p2", "p1"]);
});

test("insert between preserves existing ids and mints new", () => {
	const before = `A\n\nC`;
	const after = `A\n\nB\n\nC`;
	const beforeState = makeBeforeState(before, ["pA", "pC"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(2);

	// No deletions of existing ids
	const deletions = changes.filter((c) => c.snapshot_content === null);
	expect(deletions.length).toBe(0);

	// A new paragraph was added with a new id
	const add = changes.find(
		(c) =>
			(c.snapshot_content as any)?.type === "paragraph" &&
			(c.snapshot_content as any)?.children?.[0]?.value === "B",
	);
	expect(add).toBeTruthy();
	expect(["pA", "pC"]).not.toContain(add!.entity_id);
});

test("delete emits deletion and preserves other ids", () => {
	const before = `Keep me\n\nDelete me`;
	const after = `Keep me`;
	const beforeState = makeBeforeState(before, ["keep", "del"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	const deletion = changes.find((c) => c.entity_id === "del");
	expect(deletion).toBeTruthy();
	expect(deletion?.snapshot_content).toBeNull();
});

test("cross-type: do not map heading id to paragraph", () => {
	const before = `# Heading`;
	const after = `Paragraph`;
	const beforeState = makeBeforeState(before, ["h1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	// Expect heading deletion and new paragraph addition with a different id
	const del = changes.find(
		(c) => c.entity_id === "h1" && c.snapshot_content === null,
	);
	expect(del).toBeTruthy();
	const addPara = changes.find(
		(c) => (c.snapshot_content as any)?.type === "paragraph",
	);
	expect(addPara).toBeTruthy();
	expect(addPara!.entity_id).not.toBe("h1");
});

test("canonicalization stability: hard break form changes keep id (mod or noop)", () => {
	const before = `line  \nbreak`; // two spaces + newline
	const after = `line\\\nbreak`; // backslash + newline
	const beforeState = makeBeforeState(before, ["p1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	// Either no change or a modification for p1 is acceptable.
	const p1change = changes.find((c) => c.entity_id === "p1");
	if (p1change) {
		expect((p1change as any).snapshot_content?.type).toBe("paragraph");
	}
});

test("move section (heading + paragraph) preserves ids and updates root order", () => {
	const before = `# A\n\nPara A\n\n# B\n\nPara B`;
	const after = `# B\n\nPara B\n\n# A\n\nPara A`;
	const beforeState = makeBeforeState(before, ["hA", "pA", "hB", "pB"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	const root = changes.find((c) => c.entity_id === "root");
	expect(root?.schema).toBe(MarkdownRootSchemaV1);
	expect((root?.snapshot_content as any).order).toEqual([
		"hB",
		"pB",
		"hA",
		"pA",
	]);
});

test("duplicate paragraphs reorder is ambiguous: no root order change", () => {
	const before = `Same\n\nSame`;
	const after = `Same\n\nSame`;
	const beforeState = makeBeforeState(before, ["p1", "p2"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	const root = changes.find((c) => c.entity_id === "root");
	if (root) {
		expect((root.snapshot_content as any).order).toEqual(["p1", "p2"]);
	}
});

test("code → paragraph (cross-type) results in deletion+addition", () => {
	const before = "```js\nconsole.log(1)\n```";
	const after = "console.log(1)";
	const beforeState = makeBeforeState(before, ["code1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	const del = changes.find(
		(c) => c.entity_id === "code1" && c.snapshot_content === null,
	);
	expect(del).toBeTruthy();
	const addPara = changes.find(
		(c) => (c.snapshot_content as any)?.type === "paragraph",
	);
	expect(addPara).toBeTruthy();
});

test("heading text edit preserves id", () => {
	const before = `# Hello`;
	const after = `# Hello World`;
	const beforeState = makeBeforeState(before, ["h1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "h1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("heading");
});

test("long document: insert 1, delete 1, reorder 2 (sanity)", () => {
	const paras = Array.from({ length: 10 }, (_, i) => `P${i + 1}`);
	const before = paras.join("\n\n");
	const beforeIds = paras.map((_, i) => `p${i + 1}`);
	const beforeState = makeBeforeState(before, beforeIds);

	// After: delete P3, insert PX after P5, reorder P1 and P2
	const afterParas = ["P2", "P1", "P4", "P5", "PX", "P6", ...paras.slice(6)];
	const after = afterParas.join("\n\n");

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	const deletions = changes.filter((c) => c.snapshot_content === null);
	expect(deletions.length).toBe(1);
	const additions = changes.filter(
		(c) =>
			(c.snapshot_content as any)?.type === "paragraph" &&
			(c.snapshot_content as any)?.children?.[0]?.value === "PX",
	);
	expect(additions.length).toBe(1);

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	const order = (root!.snapshot_content as any).order as string[];
	expect(order.length).toBe(afterParas.length);
});

test("table cell edit preserves table id", () => {
	const before = `| a | b |\n| - | - |\n| 1 | 2 |`;
	const after = `| a | b |\n| - | - |\n| 1 | 3 |`;
	const beforeState = makeBeforeState(before, ["t1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	// Desired: single modification for entity t1
	const mod = changes.find((c) => c.entity_id === "t1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("table");
	const rows = (mod as any).snapshot_content?.children || [];
	const lastRowCells = rows[1]?.children || [];
	expect(lastRowCells[1]?.children?.[0]?.value).toBe("3");
});

test("duplicate paragraphs: edit the 2nd, keep p2 and no root change", () => {
	const before = `Same\n\nSame`;
	const after = `Same\n\nSame updated.`;
	const beforeState = makeBeforeState(before, ["p1", "p2"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	// p2 should be modified with updated content
	const mod = changes.find((c) => c.entity_id === "p2");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("paragraph");
	const text = (mod as any).snapshot_content?.children?.[0]?.value;
	expect(text).toContain("Same updated");

	// p1 should not be deleted
	const delP1 = changes.find(
		(c) => c.entity_id === "p1" && c.snapshot_content === null,
	);
	expect(delP1).toBeUndefined();

	// No root order change (or unchanged if present)
	const root = changes.find((c) => c.entity_id === "root");
	if (root) {
		expect((root.snapshot_content as any).order).toEqual(["p1", "p2"]);
	}
});

test("insert duplicate paragraph identical to existing: new id minted", () => {
	const before = `Same`;
	const after = `Same\n\nSame`;
	const beforeState = makeBeforeState(before, ["p1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(2);

	// There must be an added paragraph with a fresh id (not p1)
	const added = changes.find(
		(c) =>
			(c.snapshot_content as any)?.type === "paragraph" && c.entity_id !== "p1",
	);
	expect(added).toBeTruthy();

	// Root order should include p1 followed by the new id
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	const order = (root!.snapshot_content as any).order as string[];
	expect(order[0]).toBe("p1");
	expect(order[1]).toBe(added!.entity_id);
});

test("three identical paragraphs; edit the middle only", () => {
	const before = `Same\n\nSame\n\nSame`;
	const after = `Same\n\nSame updated\n\nSame`;
	const beforeState = makeBeforeState(before, ["p1", "p2", "p3"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	// Only p2 should be modified
	const mod = changes.find((c) => c.entity_id === "p2");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("paragraph");
	const t = (mod as any).snapshot_content?.children?.[0]?.value as string;
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
		expect((root.snapshot_content as any).order).toEqual(["p1", "p2", "p3"]);
	}
});

test("move a paragraph and add one word (keep id and update order)", () => {
	const before = `Alpha\n\nBeta`;
	const after = `Beta plus\n\nAlpha`;
	const beforeState = makeBeforeState(before, ["p1", "p2"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	// p2 should be modified ("Beta plus")
	const mod = changes.find((c) => c.entity_id === "p2");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("paragraph");
	const t = (mod as any).snapshot_content?.children?.[0]?.value as string;
	expect(t).toContain("Beta plus");

	// Root order updated: p2 first, then p1
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root!.snapshot_content as any).order).toEqual(["p2", "p1"]);
});

test("move a section and tweak heading text slightly (ids preserved; heading modified; order updated)", () => {
	const before = `# A\n\nPara A\n\n# B\n\nPara B`;
	const after = `# B plus\n\nPara B\n\n# A\n\nPara A`;
	const beforeState = makeBeforeState(before, ["hA", "pA", "hB", "pB"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	// Root order updated to B section first, then A
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root!.snapshot_content as any).order).toEqual([
		"hB",
		"pB",
		"hA",
		"pA",
	]);

	// Heading hB should be modified ("B plus") and keep id
	const modHB = changes.find((c) => c.entity_id === "hB");
	expect(modHB).toBeTruthy();
	expect((modHB as any).snapshot_content?.type).toBe("heading");
	const headingTxt = (modHB as any).snapshot_content?.children?.[0]
		?.value as string;
	expect(headingTxt).toContain("B plus");

	// Body pB should keep id (no deletion). It's OK if it's unchanged and has no change record
	const delPB = changes.find(
		(c) => c.entity_id === "pB" && c.snapshot_content === null,
	);
	expect(delPB).toBeUndefined();
});

test("list item text change: only list block modified (id preserved)", () => {
	const before = `- one\n- two`;
	const after = `- one\n- two changed`;
	const beforeState = makeBeforeState(before, ["list1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	// Should emit a single list block modification for entity list1
	const mod = changes.find((c) => c.entity_id === "list1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("list");

	// Only list modification expected; no root order change emitted
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
	expect(changes.length).toBe(1);
});

test("reorder list items: single list modification and no root order change", () => {
	const before = `- one\n- two\n- three`;
	const after = `- three\n- one\n- two`;
	const beforeState = makeBeforeState(before, ["list1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	// List block should be modified and keep its id
	const mod = changes.find((c) => c.entity_id === "list1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("list");

	// Only list modification expected; no root order change emitted
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
	expect(changes.length).toBe(1);
});

test("add a list item: single list modification and no root order change", () => {
	const before = `- one\n- two`;
	const after = `- one\n- two\n- three`;
	const beforeState = makeBeforeState(before, ["list1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "list1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("list");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("remove a list item: single list modification and no root order change", () => {
	const before = `- one\n- two\n- three`;
	const after = `- one\n- three`;
	const beforeState = makeBeforeState(before, ["list1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "list1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("list");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("table: add a row: single table modification and no root order change", () => {
	const before = `| a | b |\n| - | - |\n| 1 | 2 |`;
	const after = `| a | b |\n| - | - |\n| 1 | 2 |\n| 3 | 4 |`;
	const beforeState = makeBeforeState(before, ["t1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "t1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("table");

	const rows = (mod as any).snapshot_content?.children || [];
	expect(rows.length).toBe(3); // header + 2 body rows
	const lastRowCells = rows[2]?.children || [];
	expect(lastRowCells[0]?.children?.[0]?.value).toBe("3");
	expect(lastRowCells[1]?.children?.[0]?.value).toBe("4");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("table: remove a row: single table modification and no root order change", () => {
	const before = `| a | b |\n| - | - |\n| 1 | 2 |\n| 3 | 4 |`;
	const after = `| a | b |\n| - | - |\n| 1 | 2 |`;
	const beforeState = makeBeforeState(before, ["t1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "t1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("table");

	const rows = (mod as any).snapshot_content?.children || [];
	expect(rows.length).toBe(2); // header + 1 body row
	const lastRowCells = rows[1]?.children || [];
	expect(lastRowCells[0]?.children?.[0]?.value).toBe("1");
	expect(lastRowCells[1]?.children?.[0]?.value).toBe("2");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("table: reorder rows: single table modification and no root order change", () => {
	const before = `| a | b |\n| - | - |\n| 1 | 2 |\n| 3 | 4 |\n| 5 | 6 |`;
	const after = `| a | b |\n| - | - |\n| 3 | 4 |\n| 5 | 6 |\n| 1 | 2 |`;
	const beforeState = makeBeforeState(before, ["t1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "t1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("table");

	const rows = (mod as any).snapshot_content?.children || [];
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

test("paragraph → blockquote (same text): deletion + addition + root order change", () => {
	const before = `Hello`;
	const after = `> Hello`;
	const beforeState = makeBeforeState(before, ["p1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(3);

	// Paragraph deleted
	const del = changes.find(
		(c) => c.entity_id === "p1" && c.snapshot_content === null,
	);
	expect(del).toBeTruthy();

	// Blockquote added with a new id
	const addBq = changes.find(
		(c) => (c.snapshot_content as any)?.type === "blockquote",
	);
	expect(addBq).toBeTruthy();
	expect(addBq!.entity_id).not.toBe("p1");

	// Root order updated to the new id
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root!.snapshot_content as any).order).toEqual([addBq!.entity_id]);
});

test("paragraph → heading (same text): deletion + addition + root order change", () => {
	const before = `Hello`;
	const after = `# Hello`;
	const beforeState = makeBeforeState(before, ["p1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(3);

	// Paragraph deleted
	const del = changes.find(
		(c) => c.entity_id === "p1" && c.snapshot_content === null,
	);
	expect(del).toBeTruthy();

	// Heading added with a new id
	const addH = changes.find(
		(c) => (c.snapshot_content as any)?.type === "heading",
	);
	expect(addH).toBeTruthy();
	expect(addH!.entity_id).not.toBe("p1");

	// Root order updated to the new id
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root!.snapshot_content as any).order).toEqual([addH!.entity_id]);
});

test('paragraph split ("AB" → "A" + "B"): first keeps id, second gets new id', () => {
	const before = `AB`;
	const after = `A\n\nB`;
	const beforeState = makeBeforeState(before, ["p1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(3);

	// p1 should be modified to "A"
	const mod = changes.find((c) => c.entity_id === "p1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("paragraph");
	const firstText = (mod as any).snapshot_content?.children?.[0]
		?.value as string;
	expect(firstText).toBe("A");

	// A new paragraph "B" with a fresh id
	const add = changes.find(
		(c) =>
			(c.snapshot_content as any)?.type === "paragraph" && c.entity_id !== "p1",
	);
	expect(add).toBeTruthy();
	const secondText = (add as any).snapshot_content?.children?.[0]
		?.value as string;
	expect(secondText).toBe("B");

	// Root order becomes [p1, newId]
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root!.snapshot_content as any).order).toEqual(["p1", add!.entity_id]);
});

test('paragraph merge ("A" + "B" → "AB"): first keeps id (modified), second deleted', () => {
	const before = `A\n\nB`;
	const after = `AB`;
	const beforeState = makeBeforeState(before, ["p1", "p2"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(3);

	// p1 should be modified to "AB"
	const mod = changes.find((c) => c.entity_id === "p1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("paragraph");
	const text = (mod as any).snapshot_content?.children?.[0]?.value as string;
	expect(text).toBe("AB");

	// p2 deleted
	const del = changes.find(
		(c) => c.entity_id === "p2" && c.snapshot_content === null,
	);
	expect(del).toBeTruthy();

	// Root order becomes [p1]
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root!.snapshot_content as any).order).toEqual(["p1"]);
});

test("CRLF ↔ LF normalization (entire file): no changes", () => {
	const before = `Line A\r\n\r\nLine B`;
	const after = `Line A\n\nLine B`;
	const beforeState = makeBeforeState(before, ["p1", "p2"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(0);
});

test("hard break variants (spaces vs backslash, CRLF): same id, mod or noop", () => {
	// Two spaces + CRLF indicates a hard break in Markdown
	const before = `line··\r\nbreak`;
	const after = `line\\\r\nbreak`;
	const beforeState = makeBeforeState(before, ["p1"]);

	const changes = detectChanges({
		beforeState,
		after: {
			id: "f",
			path: "/f.md",
			data: encode(after.replace(/··/g, "  ")),
			metadata: {},
		},
	});
	// Either no change or a single modification for p1, but never a new id
	expect([0, 1]).toContain(changes.length);
	const newIds = changes.filter(
		(c) =>
			c.entity_id !== "p1" && (c.snapshot_content as any)?.type === "paragraph",
	);
	expect(newIds.length).toBe(0);
});

test("code block: edit content, same lang → keep id; single modification", () => {
	const before = "```js\nconsole.log(1)\n```";
	const after = "```js\nconsole.log(2)\n```";
	const beforeState = makeBeforeState(before, ["code1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "code1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("code");
	const lang = (mod as any).snapshot_content?.lang ?? null;
	expect(lang).toBe("js");
	const value = (mod as any).snapshot_content?.value as string;
	expect(value).toContain("console.log(2)");
});

test("code block: change lang only → same id; single modification", () => {
	const before = "```js\nconsole.log(1)\n```";
	const after = "```ts\nconsole.log(1)\n```";
	const beforeState = makeBeforeState(before, ["code1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "code1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("code");
	const lang = (mod as any).snapshot_content?.lang ?? null;
	expect(lang).toBe("ts");
	const value = (mod as any).snapshot_content?.value as string;
	expect(value).toContain("console.log(1)");
});

test("code block: backtick fence length 3 ↔ 4 → same id; mod or noop", () => {
	const before = "```js\nconsole.log(1)\n```";
	const after = "````js\nconsole.log(1)\n````";
	const beforeState = makeBeforeState(before, ["code1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	// Canonical serializer should normalize either way; allow 0 or 1 change but never a new id
	expect([0, 1]).toContain(changes.length);
	const add = changes.find(
		(c) =>
			(c.snapshot_content as any)?.type === "code" && c.entity_id !== "code1",
	);
	expect(add).toBeUndefined();
});

test("paragraph with link: change link text only → same paragraph id; single modification", () => {
	const before = `[text](https://example.com)`;
	const after = `[new](https://example.com)`;
	const beforeState = makeBeforeState(before, ["p1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "p1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("paragraph");

	const para = (mod as any).snapshot_content;
	const link = (para.children || []).find((n: any) => n.type === "link");
	expect(link?.url).toBe("https://example.com");
	const linkText = link?.children?.[0]?.value;
	expect(linkText).toBe("new");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("paragraph with link: change only the url → same paragraph id; single modification", () => {
	const before = `[text](https://example.com)`;
	const after = `[text](https://example.org)`;
	const beforeState = makeBeforeState(before, ["p1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "p1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("paragraph");

	const para = (mod as any).snapshot_content;
	const link = (para.children || []).find((n: any) => n.type === "link");
	expect(link?.url).toBe("https://example.org");
	const linkText = link?.children?.[0]?.value;
	expect(linkText).toBe("text");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("top-level html node: text tweak → same id; single modification", () => {
	const before = `<div>Hello</div>`;
	const after = `<div>Hello world</div>`;
	const beforeState = makeBeforeState(before, ["h1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(1);

	const mod = changes.find((c) => c.entity_id === "h1");
	expect(mod).toBeTruthy();
	expect((mod as any).snapshot_content?.type).toBe("html");
	const value = (mod as any).snapshot_content?.value as string;
	expect(value).toContain("Hello world");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeUndefined();
});

test("custom element html: add top-level element → addition + root order change", () => {
	const before = ``;
	const after = `<doc-figure src="/img.png" caption="Hello" />`;
	const beforeState = makeBeforeState(before, []);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(2);

	const add = changes.find((c) => (c.snapshot_content as any)?.type === "html");
	expect(add).toBeTruthy();
	const value = (add as any).snapshot_content?.value as string;
	expect(value).toContain("doc-figure");

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect(((root as any).snapshot_content.order as string[])[0]).toBe(
		add!.entity_id,
	);
});

test("custom element html: delete top-level element → deletion + root order change", () => {
	const before = `<doc-figure src="/img.png" caption="Hello" />`;
	const after = ``;
	const beforeState = makeBeforeState(before, ["html1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	expect(changes).toHaveLength(2);

	const del = changes.find((c) => c.entity_id === "html1");
	expect(del).toBeTruthy();
	expect(del!.snapshot_content).toBeNull();

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	expect((root as any).snapshot_content.order as string[]).toEqual([]);
});

test("Unicode NFC vs NFD accents: normalize and keep id (no extra change)", () => {
	// Café (NFC) vs Cafe + combining acute (NFD)
	const nfc = "Caf\u00E9";
	const nfd = "Cafe\u0301";
	const before = `${nfc}`;
	const after = `${nfd}`;
	const beforeState = makeBeforeState(before, ["p1"]);

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});
	// Ideal: canonicalization eliminates differences => 0 or a single mod to same id
	expect([0, 1]).toContain(changes.length);
	const foreignParagraph = changes.find(
		(c) =>
			(c.snapshot_content as any)?.type === "paragraph" && c.entity_id !== "p1",
	);
	expect(foreignParagraph).toBeUndefined();
});

test("large doc (1k paras): delete 1, insert 1, move 10 → 3 changes", () => {
	// Build 1k paragraphs via for-loop
	const paras: string[] = [];
	const beforeIds: string[] = [];
	for (let i = 1; i <= 1000; i++) {
		paras.push(`P${i}`);
		beforeIds.push(`p${i}`);
	}
	const before = paras.join("\n\n");
	const beforeState = makeBeforeState(before, beforeIds);

	// After: move P901..P910 to the front, delete P500, insert PX after P600
	const moved = paras.slice(900, 910); // P901..P910
	const remaining = paras.slice(0, 900).concat(paras.slice(910)); // exclude moved
	const remainingNoP500 = remaining.filter((s) => s !== "P500");
	const idxP600 = remainingNoP500.indexOf("P600");
	const afterParas = [
		...moved,
		...remainingNoP500.slice(0, idxP600 + 1),
		"PX",
		...remainingNoP500.slice(idxP600 + 1),
	];
	const after = afterParas.join("\n\n");

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	// One deletion (p500)
	const del = changes.find((c) => c.entity_id === "p500");
	expect(del).toBeTruthy();
	expect(del!.snapshot_content).toBeNull();

	// One addition (PX)
	const add = changes.find(
		(c) =>
			(c.snapshot_content as any)?.type === "paragraph" &&
			(c.snapshot_content as any)?.children?.[0]?.value === "PX",
	);
	expect(add).toBeTruthy();
	expect(beforeIds).not.toContain(add!.entity_id);

	// Root order updated with length 1000
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	const order = (root!.snapshot_content as any).order as string[];
	expect(order.length).toBe(1000);

	// Starts with moved ids p901..p910
	const expectedStart = Array.from({ length: 10 }, (_, i) => `p${901 + i}`);
	expect(order.slice(0, 10)).toEqual(expectedStart);

	// p500 not in order; PX appears right after p600
	expect(order).not.toContain("p500");
	const addedId = add!.entity_id;
	const idx600 = order.indexOf("p600");
	expect(idx600).toBeGreaterThanOrEqual(0);
	expect(order[idx600 + 1]).toBe(addedId);
});

test("large doc (5k): pure shuffle → root change only", () => {
	const { paras, beforeIds, markdown } = makeBigDoc(5000);
	const beforeState = makeBeforeState(markdown, beforeIds);
	const after = shuffle(paras, 123).join("\n\n");

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	// Expect ONLY a root order change
	const dels = changes.filter((c) => c.snapshot_content === null);
	const adds = changes.filter((c) => (c.snapshot_content as any)?.type);
	expect(dels.length).toBe(0);
	expect(adds.length).toBe(0);

	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();
	const order = (root!.snapshot_content as any).order as string[];
	expect(order.length).toBe(5000);
});

test("large doc (3k): ~1% tiny edits → equal number of mods, no adds/dels", () => {
	const { paras, beforeIds, markdown } = makeBigDoc(3000);
	const beforeState = makeBeforeState(markdown, beforeIds);

	const edited = applySmallEdits(paras, Math.floor(paras.length * 0.01), 99);
	const after = edited.join("\n\n");

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	const dels = changes.filter((c) => c.snapshot_content === null);
	const adds = changes.filter(
		(c) =>
			(c.snapshot_content as any)?.type &&
			c.entity_id &&
			!beforeIds.includes(c.entity_id),
	);
	const mods = changes.filter(
		(c) => (c.snapshot_content as any)?.type && beforeIds.includes(c.entity_id),
	);
	expect(dels.length).toBe(0);
	expect(adds.length).toBe(0);
	expect(mods.length).toBeGreaterThan(0);
	// Allow a little slack but expect close to 1% (±2)
	expect(
		Math.abs(mods.length - Math.floor(paras.length * 0.01)),
	).toBeLessThanOrEqual(2);
});

test("duplicates (1k Same): edit #700 only → 1 mod, no root change", () => {
	const paras = Array.from({ length: 1000 }, () => "Same");
	const beforeIds = Array.from({ length: 1000 }, (_, i) => `p${i + 1}`);
	const before = paras.join("\n\n");
	const beforeState = makeBeforeState(before, beforeIds);

	const afterParas = paras.slice();
	afterParas[699] = "Same updated";
	const after = afterParas.join("\n\n");

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	const mods = changes.filter(
		(c) => (c.snapshot_content as any)?.type === "paragraph",
	);
	expect(mods.length).toBe(1);
	expect(mods[0]!.entity_id).toBe("p700");

	const root = changes.find((c) => c.entity_id === "root");
	if (root) {
		expect((root.snapshot_content as any).order).toEqual(beforeIds); // order stable
	}
});

test("large mixed: 2k dup 'Same' blocks + move 200 unique → 1 root + targeted mods", () => {
	// Build 2000 'Same' + 200 unique tail
	const dups = Array.from({ length: 2000 }, () => "Same");
	const uniques = Array.from({ length: 200 }, (_, i) => `U${i + 1}`);
	const paras = [...dups, ...uniques];
	const beforeIds = Array.from({ length: paras.length }, (_, i) => `p${i + 1}`);
	const before = paras.join("\n\n");
	const beforeState = makeBeforeState(before, beforeIds);

	// Move the last 200 uniques to the front; edit U10 slightly
	const moved = uniques.slice();
	const remaining = dups.slice();
	const editedMoved = moved.slice();
	editedMoved[9] = editedMoved[9] + " x";
	const after = [...editedMoved, ...remaining].join("\n\n");

	const changes = detectChanges({
		beforeState,
		after: { id: "f", path: "/f.md", data: encode(after), metadata: {} },
	});

	// Expect one root, plus exactly one mod (U10), no adds/dels
	const root = changes.find((c) => c.entity_id === "root");
	expect(root).toBeTruthy();

	const dels = changes.filter((c) => c.snapshot_content === null);
	const adds = changes.filter(
		(c) =>
			(c.snapshot_content as any)?.type && !beforeIds.includes(c.entity_id),
	);
	const mods = changes.filter(
		(c) => (c.snapshot_content as any)?.type && beforeIds.includes(c.entity_id),
	);
	expect(dels.length).toBe(0);
	expect(adds.length).toBe(0);
	expect(mods.length).toBe(1);
});
