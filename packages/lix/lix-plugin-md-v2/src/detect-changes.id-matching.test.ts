/**
 * Tests focus on block-level identity only.
 * We persist top-level blocks (paragraph, heading, list, table, etc.) and the root order.
 * Nested nodes (listItem, tableCell, etc.) are not separate entities; edits to them should
 * result in a single block modification (list/table) with id preserved.
 */
import { describe, expect, test } from "vitest";
import { detectChanges } from "./detect-changes.js";
import { parseMarkdown, AstSchemas } from "@opral/markdown-wc";
import { MarkdownRootSchemaV1 } from "./schemas/root.js";

const encode = (s: string) => new TextEncoder().encode(s);

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
	const deletions = changes.filter((c) => c.snapshot_content === undefined);
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
	expect(deletion?.snapshot_content).toBeUndefined();
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
		(c) => c.entity_id === "h1" && c.snapshot_content === undefined,
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
		(c) => c.entity_id === "code1" && c.snapshot_content === undefined,
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
	expect(changes).toHaveLength(3);
	expect(changes).toHaveLength(2);
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

	const deletions = changes.filter((c) => c.snapshot_content === undefined);
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
		(c) => c.entity_id === "p1" && c.snapshot_content === undefined,
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
		(c) => c.entity_id === "p1" && c.snapshot_content === undefined,
	);
	const delP3 = changes.find(
		(c) => c.entity_id === "p3" && c.snapshot_content === undefined,
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
		(c) => c.entity_id === "pB" && c.snapshot_content === undefined,
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
