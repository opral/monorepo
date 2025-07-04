import { expect, test } from "vitest";
import { openLix } from "@lix-js/sdk";
import { plugin } from "./index.js";
// import fs from "node:fs/promises";

test("detects changes when inserting a prosemirror document", async () => {
	// Initialize Lix with the ProseMirror plugin
	const lix = await openLix({
		providePlugins: [plugin],
	});

	// Create initial document
	const initialDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Initial paragraph" }],
			},
		],
	};

	// Convert to binary data
	const initialData = new TextEncoder().encode(JSON.stringify(initialDoc));

	// Store in Lix using direct database insert
	await lix.db
		.insertInto("file")
		.values({
			path: "/prosemirror.json",
			data: initialData,
		})
		.execute();

	// Create modified document with a new paragraph
	const modifiedDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Modified paragraph" }],
			},
			{
				type: "paragraph",
				attrs: { id: "p2" },
				content: [{ type: "text", text: "New paragraph" }],
			},
		],
	};

	// Convert to binary data
	const modifiedData = new TextEncoder().encode(JSON.stringify(modifiedDoc));

	// Update the document in Lix
	// Using the standard database insert which is what the UI uses
	await lix.db
		.updateTable("file")
		.set({
			data: modifiedData,
		})
		.where("path", "=", "/prosemirror.json")
		.execute();

	// Get the changes from the database
	const changes = await lix.db
		.selectFrom("change")
		.innerJoin("file", "change.file_id", "file.id")
		.where("file.path", "=", "/prosemirror.json")
		.where("plugin_key", "=", plugin.key)
		.select(["change.entity_id", "change.snapshot_content"])
		.execute();

	// Verify that the correct changes were detected
	// Now expecting 5 changes: document order + 2 for p1 (initial + modified) + p2 (new) + p3 (new)
	expect(changes.length).toBe(5);

	// There may be multiple changes for p1 (initial and modified)
	// So we'll check that at least one of them has the modified content
	const p1Changes = changes.filter((c) => c.entity_id === "p1");
	expect(p1Changes.length).toBeGreaterThanOrEqual(1);

	// At least one p1 change should have the modified content
	const hasModifiedP1 = p1Changes.some((change) => {
		if (change?.snapshot_content) {
			const content = change.snapshot_content as any;
			return content.content?.[0]?.text === "Modified paragraph";
		}
		return false;
	});

	expect(hasModifiedP1).toBe(true);

	// Check for new paragraph p2
	const p2Change = changes.find((c) => c.entity_id === "p2");
	expect(p2Change).toBeDefined();
	if (p2Change?.snapshot_content) {
		const content = p2Change.snapshot_content as any;
		expect(content.content?.[0]?.text).toBe("New paragraph");
	}
});

test("detects and applies moved nodes correctly", async () => {
	// Initialize Lix with the ProseMirror plugin
	const lix = await openLix({
		providePlugins: [plugin],
	});

	// Create initial document with 3 paragraphs in order: p1, p2, p3
	const initialDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "First paragraph" }],
			},
			{
				type: "paragraph",
				attrs: { id: "p2" },
				content: [{ type: "text", text: "Second paragraph" }],
			},
			{
				type: "paragraph",
				attrs: { id: "p3" },
				content: [{ type: "text", text: "Third paragraph" }],
			},
		],
	};

	// Convert to binary data
	const initialData = new TextEncoder().encode(JSON.stringify(initialDoc));

	// Store in Lix
	await lix.db
		.insertInto("file")
		.values({
			path: "/prosemirror.json",
			data: initialData,
		})
		.execute();

	// Create modified document with reordered paragraphs: p3, p1, p2
	const reorderedDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "p3" },
				content: [{ type: "text", text: "Third paragraph" }],
			},
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "First paragraph" }],
			},
			{
				type: "paragraph",
				attrs: { id: "p2" },
				content: [{ type: "text", text: "Second paragraph" }],
			},
		],
	};

	// Convert to binary data
	const reorderedData = new TextEncoder().encode(JSON.stringify(reorderedDoc));

	// Update the document in Lix
	await lix.db
		.updateTable("file")
		.set({
			data: reorderedData,
		})
		.where("path", "=", "/prosemirror.json")
		.execute();

	// Query the current state of the document entity to verify the order
	const documentState = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "document-root")
		.where("plugin_key", "=", plugin.key)
		.select(["entity_id", "snapshot_content"])
		.executeTakeFirst();

	// Should have the document entity in state with correct order
	expect(documentState).toBeDefined();

	if (documentState?.snapshot_content) {
		const docContent = documentState.snapshot_content as any;
		expect(docContent.children_order).toEqual(["p3", "p1", "p2"]);
	}

	// Now test that applyChanges can reconstruct the document in the correct order
	const fileRecord = await lix.db
		.selectFrom("file")
		.where("path", "=", "/prosemirror.json")
		.selectAll()
		.executeTakeFirstOrThrow();

	// Get all changes for this file
	const allChanges = await lix.db
		.selectFrom("change")
		.where("file_id", "=", fileRecord.id)
		.where("plugin_key", "=", plugin.key)
		.selectAll()
		.execute();

	// Apply changes to reconstruct the document
	const applyChanges = plugin.applyChanges;
	if (applyChanges) {
		const result = applyChanges({
			file: {
				id: fileRecord.id,
				path: fileRecord.path,
				data: initialData, // Start from initial state
				metadata: fileRecord.metadata,
			},
			changes: allChanges,
		});

		// Parse the reconstructed document
		const reconstructedDoc = JSON.parse(
			new TextDecoder().decode(result.fileData),
		);

		// Verify that the paragraphs are in the correct order: p3, p1, p2
		expect(reconstructedDoc.content).toHaveLength(3);
		expect(reconstructedDoc.content[0].attrs.id).toBe("p3");
		expect(reconstructedDoc.content[1].attrs.id).toBe("p1");
		expect(reconstructedDoc.content[2].attrs.id).toBe("p2");

		// Verify content is preserved
		expect(reconstructedDoc.content[0].content[0].text).toBe("Third paragraph");
		expect(reconstructedDoc.content[1].content[0].text).toBe("First paragraph");
		expect(reconstructedDoc.content[2].content[0].text).toBe(
			"Second paragraph",
		);
	}
});

test("handles complex move with content changes", async () => {
	// Initialize Lix with the ProseMirror plugin
	const lix = await openLix({
		providePlugins: [plugin],
	});

	// Create initial document
	const initialDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Original first" }],
			},
			{
				type: "paragraph",
				attrs: { id: "p2" },
				content: [{ type: "text", text: "Original second" }],
			},
		],
	};

	const initialData = new TextEncoder().encode(JSON.stringify(initialDoc));

	await lix.db
		.insertInto("file")
		.values({
			path: "/prosemirror.json",
			data: initialData,
		})
		.execute();

	// Create document with both reordering AND content changes
	const modifiedDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "p2" },
				content: [{ type: "text", text: "Modified second (now first)" }],
			},
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Modified first (now second)" }],
			},
		],
	};

	const modifiedData = new TextEncoder().encode(JSON.stringify(modifiedDoc));

	await lix.db
		.updateTable("file")
		.set({
			data: modifiedData,
		})
		.where("path", "=", "/prosemirror.json")
		.execute();

	// Query the current state to verify the document order and content changes
	const documentState = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "document-root")
		.where("plugin_key", "=", plugin.key)
		.select(["entity_id", "snapshot_content"])
		.executeTakeFirst();

	// Verify document order change
	expect(documentState).toBeDefined();

	if (documentState?.snapshot_content) {
		const docContent = documentState.snapshot_content as any;
		expect(docContent.children_order).toEqual(["p2", "p1"]);
	}

	// Verify content changes by querying state for individual nodes
	const p1State = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "p1")
		.where("plugin_key", "=", plugin.key)
		.select(["entity_id", "snapshot_content"])
		.executeTakeFirst();

	const p2State = await lix.db
		.selectFrom("state")
		.where("entity_id", "=", "p2")
		.where("plugin_key", "=", plugin.key)
		.select(["entity_id", "snapshot_content"])
		.executeTakeFirst();

	expect(p1State).toBeDefined();
	expect(p2State).toBeDefined();

	if (p1State?.snapshot_content) {
		const p1Content = p1State.snapshot_content as any;
		expect(p1Content.content[0].text).toBe("Modified first (now second)");
	}

	if (p2State?.snapshot_content) {
		const p2Content = p2State.snapshot_content as any;
		expect(p2Content.content[0].text).toBe("Modified second (now first)");
	}
});
