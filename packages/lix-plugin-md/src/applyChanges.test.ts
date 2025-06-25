import { describe, test, expect } from "vitest";
import { applyChanges } from "./applyChanges.js";
import { mockChanges } from "./utilities/mockChanges.js";
import { MarkdownNodeSchemaV1 } from "./schemas/nodes.js";
import { MarkdownRootSchemaV1 } from "./schemas/root.js";
import { parseMarkdown } from "./utilities/parseMarkdown.js";

const createMockFile = (data: Uint8Array) => ({
	id: "mock",
	path: "/mock.md",
	data,
	metadata: {},
	lixcol_inherited_from_version_id: null,
	lixcol_created_at: new Date().toISOString(),
	lixcol_updated_at: new Date().toISOString(),
});

describe("applyChanges", () => {
	test("applies node insertion changes", () => {
		const beforeMarkdown = "# Title\n\nHello world.";
		const afterMarkdown = "# Title\n\nHello world.\n\nNew paragraph.";

		const beforeData = new TextEncoder().encode(beforeMarkdown);
		const afterData = new TextEncoder().encode(afterMarkdown);

		// Use mockChanges to get properly formatted changes
		const changes = mockChanges({
			file: {
				id: "mock",
				path: "/mock.md",
				metadata: null,
			},
			fileUpdates: [beforeData, afterData],
		});

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

		const changes = mockChanges({
			file: {
				id: "mock",
				path: "/mock.md",
				metadata: null,
			},
			fileUpdates: [beforeData, afterData],
		});

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

		const changes = mockChanges({
			file: {
				id: "mock",
				path: "/mock.md",
				metadata: null,
			},
			fileUpdates: [beforeData, afterData],
		});

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

		const changes = mockChanges({
			file: {
				id: "mock",
				path: "/mock.md",
				metadata: null,
			},
			fileUpdates: [beforeData, afterData],
		});
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

	test("applies changes with existing mdast_id comments", () => {
		const beforeMarkdown = `<!-- mdast_id = heading-1 -->
# Title

<!-- mdast_id = para-1 -->
Hello world.`;

		const afterMarkdown = `<!-- mdast_id = heading-1 -->
# Title

<!-- mdast_id = para-1 -->
Hello everyone.`;

		const beforeData = new TextEncoder().encode(beforeMarkdown);
		const afterData = new TextEncoder().encode(afterMarkdown);

		const changes = mockChanges({
			file: {
				id: "mock",
				path: "/mock.md",
				metadata: null,
			},
			fileUpdates: [beforeData, afterData],
		});

		const result = applyChanges({
			file: createMockFile(beforeData),
			changes,
		});

		const resultMarkdown = new TextDecoder().decode(result.fileData);

		// Should contain modified text
		expect(resultMarkdown).toContain("Hello everyone");
		expect(resultMarkdown).not.toContain("Hello world");
		// Should preserve IDs
		expect(resultMarkdown).toContain("heading-1");
		expect(resultMarkdown).toContain("para-1");
	});

	test("skips ID comments when metadata flag is set", () => {
		const markdown = "# Title\n\nHello world.";
		const data = new TextEncoder().encode(markdown);

		// Parse markdown to get AST structure
		const ast = parseMarkdown(markdown);

		// Create mock changes that would normally add the nodes
		const changes = [
			{
				id: "change-1",
				entity_id: "root",
				schema_key: MarkdownRootSchemaV1["x-lix-key"],
				schema_version: MarkdownRootSchemaV1["x-lix-version"],
				snapshot_content: {
					order: ast.children.map((node) => node.mdast_id),
				},
				file_id: "mock",
				plugin_key: "mock",
				snapshot_id: "mock",
				created_at: new Date().toISOString(),
			},
			...ast.children.map((node) => ({
				id: `change-${node.mdast_id}`,
				entity_id: node.mdast_id,
				schema_key: MarkdownNodeSchemaV1["x-lix-key"],
				schema_version: MarkdownNodeSchemaV1["x-lix-version"],
				snapshot_content: node,
				file_id: "mock",
				plugin_key: "mock",
				snapshot_id: "mock",
				created_at: new Date().toISOString(),
			})),
		];

		const result = applyChanges({
			file: {
				...createMockFile(data),
				metadata: { skip_id_comments: true },
			},
			changes,
		});

		const resultMarkdown = new TextDecoder().decode(result.fileData);

		// Should not contain ID comments
		expect(resultMarkdown).not.toContain("mdast_id");
		// Should still contain content
		expect(resultMarkdown).toContain("Title");
		expect(resultMarkdown).toContain("Hello world");
	});
});
