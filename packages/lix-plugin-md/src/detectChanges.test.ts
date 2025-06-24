import { describe, test, expect } from "vitest";
import { detectChanges } from "./detectChanges.js";
import { MarkdownNodeSchemaV1 } from "./schemas/nodes.js";
import { MarkdownRootSchemaV1 } from "./schemas/root.js";

const encode = (text: string) => new TextEncoder().encode(text);

describe("change detection", () => {
	test("it should not detect changes if the markdown file did not update", async () => {
		const before = encode(`<!-- mdast_id = abc123 -->
# Heading

<!-- mdast_id = def456 -->
Some text.`);
		const after = before;

		const detectedChanges = detectChanges({
			before: { id: "random", path: "x.md", data: before, metadata: {} },
			after: { id: "random", path: "x.md", data: after, metadata: {} },
		});

		expect(detectedChanges).toEqual([]);
	});

	test("it should detect a new node", async () => {
		const before = encode(`<!-- mdast_id = abc123 -->
# Heading

<!-- mdast_id = def456 -->
Some text.`);
		const after = encode(`<!-- mdast_id = abc123 -->
# Heading

<!-- mdast_id = def456 -->
Some text.

<!-- mdast_id = xyz789 -->
New paragraph.`);

		const detectedChanges = detectChanges({
			before: { id: "random", path: "x.md", data: before, metadata: {} },
			after: { id: "random", path: "x.md", data: after, metadata: {} },
		});

		expect(detectedChanges.length).toBeGreaterThan(0);
		const addedNode = detectedChanges.find((c) => c.entity_id === "xyz789");
		expect(addedNode).toBeTruthy();
		expect(addedNode?.schema).toBe(MarkdownNodeSchemaV1);
	});

	test("it should detect an updated node", async () => {
		const before = encode(`<!-- mdast_id = abc123 -->
# Heading

<!-- mdast_id = def456 -->
Some text.`);
		const after = encode(`<!-- mdast_id = abc123 -->
# Heading

<!-- mdast_id = def456 -->
Updated text.`);

		const detectedChanges = detectChanges({
			before: { id: "random", path: "x.md", data: before, metadata: {} },
			after: { id: "random", path: "x.md", data: after, metadata: {} },
		});

		expect(detectedChanges.length).toBeGreaterThan(0);
		const updatedNode = detectedChanges.find((c) => c.entity_id === "def456");
		expect(updatedNode).toBeTruthy();
		expect(updatedNode?.schema).toBe(MarkdownNodeSchemaV1);
	});

	test("it should detect a deleted node", async () => {
		const before = encode(`<!-- mdast_id = abc123 -->
# Heading

<!-- mdast_id = def456 -->
Some text.

<!-- mdast_id = xyz789 -->
Another paragraph.`);
		const after = encode(`<!-- mdast_id = abc123 -->
# Heading

<!-- mdast_id = def456 -->
Some text.`);

		const detectedChanges = detectChanges({
			before: { id: "random", path: "x.md", data: before, metadata: {} },
			after: { id: "random", path: "x.md", data: after, metadata: {} },
		});

		expect(detectedChanges.length).toBeGreaterThan(0);
		const deletedNode = detectedChanges.find((c) => c.entity_id === "xyz789");
		expect(deletedNode).toBeTruthy();
		expect(deletedNode?.snapshot_content).toBe(null);
	});

	test("it should detect node reordering", async () => {
		const before = encode(`<!-- mdast_id = para-1 -->
First paragraph

<!-- mdast_id = para-2 -->
Second paragraph`);

		const after = encode(`<!-- mdast_id = para-2 -->
Second paragraph

<!-- mdast_id = para-1 -->
First paragraph`);

		const detectedChanges = detectChanges({
			before: { id: "random", path: "x.md", data: before, metadata: {} },
			after: { id: "random", path: "x.md", data: after, metadata: {} },
		});

		const orderChange = detectedChanges.find((c) => c.entity_id === "root");
		expect(orderChange).toBeTruthy();
		expect(orderChange?.schema).toBe(MarkdownRootSchemaV1);
		expect((orderChange?.snapshot_content as any)?.order).toEqual([
			"para-2",
			"para-1",
		]);
	});

	test("it should handle empty documents", async () => {
		const before = encode("");
		const after = encode("# New heading");

		const detectedChanges = detectChanges({
			before: { id: "random", path: "x.md", data: before, metadata: {} },
			after: { id: "random", path: "x.md", data: after, metadata: {} },
		});

		expect(detectedChanges.length).toBeGreaterThan(0);
		const addedNode = detectedChanges.find(
			(c) =>
				c.snapshot_content && (c.snapshot_content as any).type === "heading",
		);
		expect(addedNode).toBeTruthy();
	});
});
