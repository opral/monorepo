import { describe, test, expect } from "vitest";
import { applyChanges } from "./apply-changes.js";
import { MarkdownRootSchemaV1 } from "./schemas/root.js";
import { parseMarkdown, AstSchemas } from "@opral/markdown-wc";

const createMockFile = (data: Uint8Array) => ({
	id: "mock",
	path: "/mock.md",
	data,
	metadata: {},
	lixcol_inherited_from_version_id: null,
	lixcol_created_at: new Date().toISOString(),
	lixcol_updated_at: new Date().toISOString(),
});

function buildChangesFromAst(astMarkdown: string) {
	const ast = parseMarkdown(astMarkdown) as any;
	// assign deterministic ids per top-level node
	const ids: string[] = [];
	const nodes: any[] = [];
	ast.children.forEach((n: any, i: number) => {
		const id = `n${i + 1}`;
		n.data = { ...(n.data ?? {}), id };
		ids.push(id);
		nodes.push(n);
	});
	const created_at = new Date().toISOString();
	const changes = [
		{
			id: "root-change",
			entity_id: "root",
			schema_key: MarkdownRootSchemaV1["x-lix-key"],
			schema_version: MarkdownRootSchemaV1["x-lix-version"],
			snapshot_content: { order: ids },
			file_id: "mock",
			plugin_key: "mock",
			snapshot_id: "mock",
			created_at,
		},
		...nodes.map((node, idx) => ({
			id: `change-${idx + 1}`,
			entity_id: node.data.id,
			schema_key: (AstSchemas.schemasByType as any)[node.type]["x-lix-key"],
			schema_version: (AstSchemas.schemasByType as any)[node.type][
				"x-lix-version"
			],
			snapshot_content: node,
			file_id: "mock",
			plugin_key: "mock",
			snapshot_id: "mock",
			created_at,
		})),
	];
	return changes as any;
}

describe("applyChanges", () => {
	test("applies node insertion changes", () => {
		const beforeMarkdown = "# Title\n\nHello world.";
		const afterMarkdown = "# Title\n\nHello world.\n\nNew paragraph.";

		const beforeData = new TextEncoder().encode(beforeMarkdown);
		const afterData = new TextEncoder().encode(afterMarkdown);

		const changes = buildChangesFromAst(new TextDecoder().decode(afterData));

		// Apply changes to reconstruct
		const result = applyChanges({
			file: createMockFile(beforeData),
			changes,
		});

		const resultMarkdown = new TextDecoder().decode(result.fileData);

		// Should contain the new paragraph
		expect(resultMarkdown).toContain("New paragraph");
		// Should preserve existing content
		expect(resultMarkdown).toContain("Title");
		expect(resultMarkdown).toContain("Hello world");
	});

	test("applies node modification changes", () => {
		const beforeMarkdown = "# Title\n\nHello world.";
		const afterMarkdown = "# Title\n\nHello everyone.";

		const beforeData = new TextEncoder().encode(beforeMarkdown);
		const afterData = new TextEncoder().encode(afterMarkdown);

		const changes = buildChangesFromAst(new TextDecoder().decode(afterData));

		const result = applyChanges({
			file: createMockFile(beforeData),
			changes,
		});

		const resultMarkdown = new TextDecoder().decode(result.fileData);

		// Should contain modified text
		expect(resultMarkdown).toContain("Hello everyone");
		expect(resultMarkdown).not.toContain("Hello world");
		// Should preserve title
		expect(resultMarkdown).toContain("Title");
	});

	test("applies node deletion changes", () => {
		const beforeMarkdown = "# Title\n\nHello world.\n\nGoodbye!";
		const afterMarkdown = "# Title\n\nHello world.";

		const beforeData = new TextEncoder().encode(beforeMarkdown);
		const afterData = new TextEncoder().encode(afterMarkdown);

		const changes = buildChangesFromAst(new TextDecoder().decode(afterData));

		const result = applyChanges({
			file: createMockFile(beforeData),
			changes,
		});

		const resultMarkdown = new TextDecoder().decode(result.fileData);

		// Should not contain deleted text
		expect(resultMarkdown).not.toContain("Goodbye!");
		// Should preserve remaining content
		expect(resultMarkdown).toContain("Title");
		expect(resultMarkdown).toContain("Hello world");
	});

	test("applies node reordering changes", () => {
		const beforeMarkdown = "# Title\n\nParagraph 1.\n\nParagraph 2.";
		const afterMarkdown = "# Title\n\nParagraph 2.\n\nParagraph 1.";

		const beforeData = new TextEncoder().encode(beforeMarkdown);
		const afterData = new TextEncoder().encode(afterMarkdown);

		const changes = buildChangesFromAst(new TextDecoder().decode(afterData));
		const result = applyChanges({
			file: createMockFile(beforeData),
			changes,
		});

		const resultMarkdown = new TextDecoder().decode(result.fileData);

		// Should contain both paragraphs
		expect(resultMarkdown).toContain("Paragraph 1");
		expect(resultMarkdown).toContain("Paragraph 2");
		// Should have them in new order (Paragraph 2 before Paragraph 1)
		const para1Index = resultMarkdown.indexOf("Paragraph 1");
		const para2Index = resultMarkdown.indexOf("Paragraph 2");
		expect(para2Index).toBeLessThan(para1Index);
	});

	test("handles empty changes gracefully", () => {
		const markdown = "# Title\n\nHello world.";
		const data = new TextEncoder().encode(markdown);

		const result = applyChanges({
			file: createMockFile(data),
			changes: [],
		});

		const resultMarkdown = new TextDecoder().decode(result.fileData);

		// Should return empty content when no changes provided
		expect(resultMarkdown.trim()).toBe("");
	});

	// The plugin no longer writes HTML id comments; those tests were removed.
});
