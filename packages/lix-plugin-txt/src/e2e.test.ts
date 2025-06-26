import { expect, test } from "vitest";
import { openLixInMemory } from "@lix-js/sdk";
import { plugin } from "./index.js";

test("detects changes when modifying a text document", async () => {
	// Initialize Lix with the text plugin
	const lix = await openLixInMemory({
		providePlugins: [plugin],
	});

	// Create initial text content
	const initialText = "Initial text content";
	const initialData = new TextEncoder().encode(initialText);

	// Store in Lix using direct database insert
	await lix.db
		.insertInto("file")
		.values({
			path: "/document.md",
			data: initialData,
		})
		.execute();

	// Create modified text content
	const modifiedText = "Modified text content with additional information";
	const modifiedData = new TextEncoder().encode(modifiedText);

	// Update the document in Lix
	await lix.db
		.updateTable("file")
		.set({
			data: modifiedData,
		})
		.where("path", "=", "/document.md")
		.execute();

	// Get the changes from the database
	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.path", "=", "/document.md")
		.where("plugin_key", "=", plugin.key)
		.select(["change.entity_id", "change.snapshot_content"])
		.execute();

	// Verify that changes were detected
	// One for the initial content, one for the modified content
	expect(changes.length).toBe(2);

	expect(changes[0]?.snapshot_content?.text).toBe(initialText);
	expect(changes[1]?.snapshot_content?.text).toBe(modifiedText);
});
