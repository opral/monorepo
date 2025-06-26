import { expect, test } from "vitest";
import { openLixInMemory } from "@lix-js/sdk";
import { MarkdownNodeSchemaV1, plugin } from "./index.js";

test("detects changes when inserting markdown file", async () => {
	// Initialize Lix with the markdown plugin
	const lix = await openLixInMemory({
		providePlugins: [plugin],
	});

	// Create markdown content with multiple blocks
	const markdownContent = `# Main Header

This is a paragraph with some content.

## Subsection

Another paragraph here.`;
	const markdownData = new TextEncoder().encode(markdownContent);

	// Store in Lix - this should trigger detectChanges
	await lix.db
		.insertInto("file")
		.values({
			path: "/document.md",
			data: markdownData,
		})
		.execute();

	// Get the detected changes
	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.path", "=", "/document.md")
		.where("plugin_key", "=", plugin.key)
		.select(["change.entity_id", "change.snapshot_content"])
		.execute();

	// Verify that changes were detected for each markdown block
	expect(changes.length).toBeGreaterThan(0);

	// Check that we have the expected nodes
	const nodeChanges = changes.filter(
		(c) =>
			c.snapshot_content &&
			typeof c.snapshot_content === "object" &&
			c.snapshot_content.type,
	);

	// Should have detected the heading nodes
	const headingChanges = nodeChanges.filter(
		(c) => c.snapshot_content?.type === "heading",
	);
	expect(headingChanges.length).toBe(2); // # Main Header and ## Subsection

	// Should have detected the paragraph nodes
	const paragraphChanges = nodeChanges.filter(
		(c) => c.snapshot_content?.type === "paragraph",
	);
	expect(paragraphChanges.length).toBe(2); // Two paragraphs

	// Verify specific content was detected by checking the serialized markdown content
	const hasMainHeader = nodeChanges.some((c) => {
		if (c.snapshot_content?.type === "heading") {
			return c.snapshot_content?.children?.[0]?.value?.includes("Main Header");
		}
		return false;
	});
	expect(hasMainHeader).toBe(true);

	const hasSubsection = nodeChanges.some((c) => {
		if (c.snapshot_content?.type === "heading") {
			return c.snapshot_content?.children?.[0]?.value?.includes("Subsection");
		}
		return false;
	});
	expect(hasSubsection).toBe(true);

	const hasParagraphContent = nodeChanges.some((c) => {
		if (c.snapshot_content?.type === "paragraph") {
			return c.snapshot_content?.children?.[0]?.value?.includes(
				"paragraph with some content",
			);
		}
		return false;
	});
	expect(hasParagraphContent).toBe(true);

	const hasAnotherParagraph = nodeChanges.some((c) => {
		if (c.snapshot_content?.type === "paragraph") {
			return c.snapshot_content?.children?.[0]?.value?.includes(
				"Another paragraph here",
			);
		}
		return false;
	});
	expect(hasAnotherParagraph).toBe(true);
});

test("programatically mutating entities should be reflected in the file", async () => {
	// Initialize Lix with the markdown plugin
	const lix = await openLixInMemory({
		providePlugins: [plugin],
	});

	// 1. Insert a markdown with nodes that have explicit IDs
	const initialMarkdown = `<!-- mdast_id = abc123 -->
# Title

<!-- mdast_id = def456 -->
This is the original paragraph content.`;
	const initialData = new TextEncoder().encode(initialMarkdown);

	await lix.db
		.insertInto("file")
		.values({
			id: "file1",
			path: "/test.md",
			data: initialData,
		})
		.execute();

	// 2. Mutate the paragraph via state using the known entity_id
	// Create proper MD-AST node structure for paragraph
	await lix.db
		.updateTable("state_all")
		.set({
			snapshot_content: {
				type: "paragraph",
				mdast_id: "def456",
				children: [
					{
						type: "text",
						value: "This is the updated paragraph content.",
						mdast_id: "def456-text",
					},
				],
			},
		})
		.where("entity_id", "=", "def456")
		.where("schema_key", "=", MarkdownNodeSchemaV1["x-lix-key"])
		.where("file_id", "=", "file1")
		.execute();

	// 3. Mutate the title via state using the known entity_id
	// Create proper MD-AST node structure for heading
	await lix.db
		.updateTable("state_all")
		.set({
			snapshot_content: {
				type: "heading",
				depth: 1,
				mdast_id: "abc123",
				children: [
					{
						type: "text",
						value: "This is the updated title.",
						mdast_id: "abc123-text",
					},
				],
			},
		})
		.where("entity_id", "=", "abc123")
		.where("schema_key", "=", MarkdownNodeSchemaV1["x-lix-key"])
		.where("file_id", "=", "file1")
		.execute();

	// 4. Query the file after the programmatic mutation
	const updatedFile = await lix.db
		.selectFrom("file")
		.where("path", "=", "/test.md")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Decode and verify the updated content
	const updatedMarkdown = new TextDecoder().decode(updatedFile.data);

	// Should contain the updated content with mdast_id comments
	expect(updatedMarkdown).toContain("This is the updated title.");
	expect(updatedMarkdown).toContain("This is the updated paragraph content.");
	expect(updatedMarkdown).toContain("<!-- mdast_id = abc123 -->");
	expect(updatedMarkdown).toContain("<!-- mdast_id = def456 -->");
});
