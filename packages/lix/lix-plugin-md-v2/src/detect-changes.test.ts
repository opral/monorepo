import { describe, test, expect } from "vitest";
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
	expect(deletedNode?.snapshot_content).toBeUndefined();
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
