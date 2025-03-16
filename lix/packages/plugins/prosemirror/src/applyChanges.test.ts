import { expect, test } from "vitest";
import { applyChanges } from "./applyChanges.js";
import { mockChanges } from "./utilities/mockChanges.js";

// Test that detectChanges and applyChanges are in sync using mockChanges function
test("it detects and applies changes to a Prosemirror document", async () => {
	// Document without any paragraphs
	const initialDoc = {
		type: "doc",
		content: [],
	};
	
	// Document with one paragraph
	const afterFirstChange = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				_id: "para-1",
				content: [
					{
						type: "text",
						text: "Hello, world!",
					},
				],
			},
		],
	};
	
	// Document with updated first paragraph and an additional paragraph
	const afterSecondChange = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				_id: "para-1",
				content: [
					{
						type: "text",
						text: "Hello, updated world!",
					},
				],
			},
			{
				type: "paragraph",
				_id: "para-2",
				content: [
					{
						type: "text",
						text: "This is a new paragraph.",
					},
				],
			},
		],
	};
	
	// Document with first paragraph updated, second paragraph remained, and third paragraph added
	const afterThirdChange = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				_id: "para-1",
				content: [
					{
						type: "text",
						text: "Hello, final world!",
					},
				],
			},
			{
				type: "paragraph",
				_id: "para-2",
				content: [
					{
						type: "text",
						text: "This is a new paragraph.",
					},
				],
			},
			{
				type: "paragraph",
				_id: "para-3",
				content: [
					{
						type: "text",
						text: "A third paragraph is added.",
					},
				],
			},
		],
	};
	
	// Document with the second paragraph deleted
	const afterFourthChange = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				_id: "para-1",
				content: [
					{
						type: "text",
						text: "Hello, final world!",
					},
				],
			},
			{
				type: "paragraph",
				_id: "para-3",
				content: [
					{
						type: "text",
						text: "A third paragraph is added.",
					},
				],
			},
		],
	};
	
	// Convert to Uint8Array
	const before = new TextEncoder().encode(JSON.stringify(initialDoc));
	const firstUpdate = new TextEncoder().encode(JSON.stringify(afterFirstChange));
	const secondUpdate = new TextEncoder().encode(JSON.stringify(afterSecondChange));
	const thirdUpdate = new TextEncoder().encode(JSON.stringify(afterThirdChange));
	const fourthUpdate = new TextEncoder().encode(JSON.stringify(afterFourthChange));
	
	// Create the Lix instance and simulate the file updates
	const { lix, changes } = await mockChanges({
		file: { id: "prosemirror-doc", path: "/prosemirror.json" },
		fileUpdates: [before, firstUpdate, secondUpdate, thirdUpdate, fourthUpdate],
	});
	
	// Apply the detected changes back to the initial document
	const { fileData: applied } = await applyChanges({
		lix,
		file: { id: "prosemirror-doc", path: "/prosemirror.json", data: before, metadata: null },
		changes,
	});
	
	// The resulting document should match the final update
	const appliedDoc = JSON.parse(new TextDecoder().decode(applied));
	const expectedDoc = JSON.parse(new TextDecoder().decode(fourthUpdate));
	
	expect(appliedDoc).toEqual(expectedDoc);
});

// Test specifically focusing on create, update, and delete operations
test("it handles create, update, and delete operations correctly", async () => {
	// Initial document with a single paragraph
	const initialDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				_id: "para-1",
				content: [
					{
						type: "text",
						text: "Hello, world!",
					},
				],
			},
		],
	};
	
	// Update para-1, add para-2, and later delete para-2
	const afterFirstChange = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				_id: "para-1",
				content: [
					{
						type: "text",
						text: "Updated paragraph text.",
					},
				],
			},
			{
				type: "paragraph",
				_id: "para-2",
				content: [
					{
						type: "text",
						text: "This paragraph will be deleted.",
					},
				],
			},
		],
	};
	
	// Final document with para-1 updated and para-2 deleted
	const afterSecondChange = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				_id: "para-1",
				content: [
					{
						type: "text",
						text: "Updated paragraph text.",
					},
				],
			},
		],
	};
	
	// Convert to Uint8Array
	const initial = new TextEncoder().encode(JSON.stringify(initialDoc));
	const firstUpdate = new TextEncoder().encode(JSON.stringify(afterFirstChange));
	const secondUpdate = new TextEncoder().encode(JSON.stringify(afterSecondChange));
	
	// Create the Lix instance and simulate the file updates to generate changes
	const { lix, changes } = await mockChanges({
		file: { id: "test-doc-crud", path: "/test-crud.json" },
		fileUpdates: [initial, firstUpdate, secondUpdate],
	});
	
	// Apply the detected changes back to the initial document
	const { fileData: applied } = await applyChanges({
		lix,
		file: { id: "test-doc-crud", path: "/test-crud.json", data: initial, metadata: null },
		changes,
	});
	
	// The resulting document should match the final update
	const appliedDoc = JSON.parse(new TextDecoder().decode(applied));
	const expectedDoc = JSON.parse(new TextDecoder().decode(secondUpdate));
	
	expect(appliedDoc).toEqual(expectedDoc);
});