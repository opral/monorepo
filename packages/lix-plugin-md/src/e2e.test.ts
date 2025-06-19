import { expect, test } from "vitest";
import { openLixInMemory } from "@lix-js/sdk";
import { MarkdownBlockSchemaV1, plugin } from "./index.js";

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
		.innerJoin("snapshot", "change.snapshot_id", "snapshot.id")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.path", "=", "/document.md")
		.where("plugin_key", "=", plugin.key)
		.select(["change.entity_id", "snapshot.content as snapshot_content"])
		.execute();

	// Verify that changes were detected for each markdown block
	expect(changes.length).toBeGreaterThan(0);

	// Check that we have the expected blocks
	const blockChanges = changes.filter(
		(c) => c.snapshot_content?.text && c.snapshot_content?.type,
	);

	// Should have detected the heading blocks
	const headingChanges = blockChanges.filter(
		(c) => c.snapshot_content?.type === "heading",
	);
	expect(headingChanges.length).toBe(2); // # Main Header and ## Subsection

	// Should have detected the paragraph blocks
	const paragraphChanges = blockChanges.filter(
		(c) => c.snapshot_content?.type === "paragraph",
	);
	expect(paragraphChanges.length).toBe(2); // Two paragraphs

	// Verify specific content was detected
	expect(
		blockChanges.some((c) => c.snapshot_content?.text?.includes("Main Header")),
	).toBe(true);
	expect(
		blockChanges.some((c) =>
			c.snapshot_content?.text?.includes("paragraph with some content"),
		),
	).toBe(true);
	expect(
		blockChanges.some((c) => c.snapshot_content?.text?.includes("Subsection")),
	).toBe(true);
	expect(
		blockChanges.some((c) =>
			c.snapshot_content?.text?.includes("Another paragraph here"),
		),
	).toBe(true);
});

test("programatically mutating entities should be reflected in the file", async () => {
	// Initialize Lix with the markdown plugin
	const lix = await openLixInMemory({
		providePlugins: [plugin],
	});

	// 1. Insert a markdown with a paragraph that has an explicit id
	const initialMarkdown = `<!-- id: abc123 -->
# Title

<!-- id: def456 -->
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

	// 2. Mutate the paragraph via state_active using the known entity_id
	await lix.db
		.updateTable("state_active")
		.set({
			snapshot_content: {
				id: "def456",
				text: "This is the updated paragraph content.",
				type: "paragraph",
			},
		})
		.where("entity_id", "=", "def456")
		.where("schema_key", "=", MarkdownBlockSchemaV1["x-lix-key"])
		.where("file_id", "=", "file1")
		.execute();

	// 2. Mutate the title via state_active using the known entity_id
	await lix.db
		.updateTable("state_active")
		.set({
			snapshot_content: {
				id: "abc123",
				text: "# This is the updated title.",
				type: "heading",
			},
		})
		.where("entity_id", "=", "abc123")
		.where("schema_key", "=", MarkdownBlockSchemaV1["x-lix-key"])
		.where("file_id", "=", "file1")
		.execute();

	// 3. Query the file after the programmatic mutation
	const updatedFile = await lix.db
		.selectFrom("file")
		.where("path", "=", "/test.md")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Decode and verify the updated content
	const updatedMarkdown = new TextDecoder().decode(updatedFile.data);

	expect(updatedMarkdown).toBe(`<!-- id: abc123 -->
# This is the updated title.

<!-- id: def456 -->
This is the updated paragraph content.`);
});
