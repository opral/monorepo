import { expect, test } from "vitest";
import { applyChanges } from "./applyChanges.js";
import { mockChanges } from "./utilities/mockChanges.js";
import type { LixPlugin } from "@lix-js/sdk";

type ApplyChangesArgs = Parameters<NonNullable<LixPlugin["applyChanges"]>>[0];

test("handles empty initial file data by starting with an empty document", () => {
	const result = applyChanges({
		file: {
			id: "doc",
			path: "/prosemirror.json",
			directory_id: null,
			name: "prosemirror",
			extension: "json",
			data: new Uint8Array(),
		},
		changes: [],
	});

	expect(JSON.parse(new TextDecoder().decode(result.fileData))).toEqual({
		type: "doc",
		content: [],
	});
});

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
				attrs: { id: "para-1" },
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
				attrs: { id: "para-1" },
				content: [
					{
						type: "text",
						text: "Hello, updated world!",
					},
				],
			},
			{
				type: "paragraph",
				attrs: { id: "para-2" },
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
				attrs: { id: "para-1" },
				content: [
					{
						type: "text",
						text: "Hello, final world!",
					},
				],
			},
			{
				type: "paragraph",
				attrs: { id: "para-2" },
				content: [
					{
						type: "text",
						text: "This is a new paragraph.",
					},
				],
			},
			{
				type: "paragraph",
				attrs: { id: "para-3" },
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
				attrs: { id: "para-1" },
				content: [
					{
						type: "text",
						text: "Hello, final world!",
					},
				],
			},
			{
				type: "paragraph",
				attrs: { id: "para-3" },
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
	const firstUpdate = new TextEncoder().encode(
		JSON.stringify(afterFirstChange),
	);
	const secondUpdate = new TextEncoder().encode(
		JSON.stringify(afterSecondChange),
	);
	const thirdUpdate = new TextEncoder().encode(
		JSON.stringify(afterThirdChange),
	);
	const fourthUpdate = new TextEncoder().encode(
		JSON.stringify(afterFourthChange),
	);

	// Create the Lix instance and simulate the file updates
	const changes = await mockChanges({
		file: { id: "prosemirror-doc", path: "/prosemirror.json" },
		fileUpdates: [before, firstUpdate, secondUpdate, thirdUpdate, fourthUpdate],
	});

	// Apply the detected changes back to the initial document
	const { fileData: applied } = applyChanges({
		file: {
			id: "prosemirror-doc",
			path: "/prosemirror.json",
			data: before,
			metadata: null,
		},
		changes,
	} as ApplyChangesArgs);

	// Parse the document
	const appliedDoc = JSON.parse(new TextDecoder().decode(applied));

	// Define the expected structure
	const expectedDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "para-1" },
				content: [
					{
						type: "text",
						text: "Hello, final world!",
					},
				],
			},
			{
				type: "paragraph",
				attrs: { id: "para-3" },
				content: [
					{
						type: "text",
						text: "A third paragraph is added.",
					},
				],
			},
		],
	};

	// Verify structure
	expect(appliedDoc.type).toEqual("doc");
	expect(appliedDoc.content).toHaveLength(2);

	// Check content has expected items
	expect(appliedDoc.content).toContainEqual(expectedDoc.content[0]);
	expect(appliedDoc.content).toContainEqual(expectedDoc.content[1]);
});

// Test specifically focusing on create, update, and delete operations
test("it handles create, update, and delete operations correctly", async () => {
	// Initial document with a single paragraph
	const initialDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "para-1" },
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
				attrs: { id: "para-1" },
				content: [
					{
						type: "text",
						text: "Updated paragraph text.",
					},
				],
			},
			{
				type: "paragraph",
				attrs: { id: "para-2" },
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
				attrs: { id: "para-1" },
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
	const firstUpdate = new TextEncoder().encode(
		JSON.stringify(afterFirstChange),
	);
	const secondUpdate = new TextEncoder().encode(
		JSON.stringify(afterSecondChange),
	);

	// Create the Lix instance and simulate the file updates to generate changes
	const changes = await mockChanges({
		file: { id: "test-doc-crud", path: "/test-crud.json" },
		fileUpdates: [initial, firstUpdate, secondUpdate],
	});

	// Apply the detected changes back to the initial document
	const { fileData: applied } = applyChanges({
		file: {
			id: "test-doc-crud",
			path: "/test-crud.json",
			data: initial,
			metadata: null,
		},
		changes,
	} as ApplyChangesArgs);

	// Parse the document
	const appliedDoc = JSON.parse(new TextDecoder().decode(applied));

	// Define the expected structure
	const expectedDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "para-1" },
				content: [
					{
						type: "text",
						text: "Updated paragraph text.",
					},
				],
			},
		],
	};

	// Verify structure
	expect(appliedDoc.type).toEqual("doc");
	expect(appliedDoc.content).toHaveLength(1);
	expect(appliedDoc.content[0]).toEqual(expectedDoc.content[0]);
});

// Test handling of text with marks (bold, italic, links)
test("it correctly applies changes to text with marks", async () => {
	// Initial document with plain text
	const initialDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "p-1" },
				content: [
					{
						type: "text",
						text: "Plain text paragraph",
					},
				],
			},
		],
	};

	// Update with styled text (bold, italic, link)
	const afterChange = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: { id: "p-1" },
				content: [
					{
						type: "text",
						text: "Text with ",
					},
					{
						type: "text",
						text: "bold",
						marks: [{ type: "strong" }],
					},
					{
						type: "text",
						text: " and ",
					},
					{
						type: "text",
						text: "italic",
						marks: [{ type: "em" }],
					},
					{
						type: "text",
						text: " and a ",
					},
					{
						type: "text",
						text: "link",
						marks: [
							{
								type: "link",
								attrs: {
									href: "https://example.com",
									title: "Example",
								},
							},
						],
					},
				],
			},
		],
	};

	// Convert to Uint8Array
	const initial = new TextEncoder().encode(JSON.stringify(initialDoc));
	const update = new TextEncoder().encode(JSON.stringify(afterChange));

	// Create the Lix instance and simulate the file updates
	const changes = await mockChanges({
		file: { id: "text-with-marks", path: "/text-with-marks.json" },
		fileUpdates: [initial, update],
	});

	// Apply the detected changes back to the initial document
	const { fileData: applied } = applyChanges({
		file: {
			id: "text-with-marks",
			path: "/text-with-marks.json",
			data: initial,
			metadata: null,
		},
		changes,
	} as ApplyChangesArgs);

	// Parse the document
	const appliedDoc = JSON.parse(new TextDecoder().decode(applied));

	// Verify structure
	expect(appliedDoc.type).toEqual("doc");
	expect(appliedDoc.content).toHaveLength(1);

	// Validate paragraph structure and content
	const paragraph = appliedDoc.content[0];
	expect(paragraph.attrs?.id).toEqual("p-1");
	expect(paragraph.content).toHaveLength(6);

	// Check text with marks
	expect(paragraph.content[1].text).toEqual("bold");
	expect(paragraph.content[1].marks[0].type).toEqual("strong");

	expect(paragraph.content[3].text).toEqual("italic");
	expect(paragraph.content[3].marks[0].type).toEqual("em");

	expect(paragraph.content[5].text).toEqual("link");
	expect(paragraph.content[5].marks[0].type).toEqual("link");
	expect(paragraph.content[5].marks[0].attrs.href).toEqual(
		"https://example.com",
	);
});

// Test handling of mixed content with headings, code blocks, and other elements
test("it correctly applies changes to mixed content", async () => {
	// Initial document with various elements
	const initialDoc = {
		type: "doc",
		content: [
			{
				type: "heading",
				attrs: { id: "heading-1", level: 1 },
				content: [
					{
						type: "text",
						text: "Original Heading",
					},
				],
			},
			{
				type: "paragraph",
				attrs: { id: "p-1" },
				content: [
					{
						type: "text",
						text: "A simple paragraph",
					},
				],
			},
			{
				type: "code_block",
				attrs: { id: "code-1", language: "javascript" },
				content: [
					{
						type: "text",
						text: "console.log('hello world');",
					},
				],
			},
		],
	};

	// Update with modified heading, new paragraph, and changed code block
	const afterChange = {
		type: "doc",
		content: [
			{
				type: "heading",
				attrs: { id: "heading-1", level: 2 }, // Changed level
				content: [
					{
						type: "text",
						text: "Modified Heading",
					},
				],
			},
			{
				type: "paragraph",
				attrs: { id: "p-1" },
				content: [
					{
						type: "text",
						text: "A modified paragraph with ",
					},
					{
						type: "text",
						text: "formatting",
						marks: [{ type: "strong" }],
					},
				],
			},
			{
				type: "paragraph",
				attrs: { id: "p-2" },
				content: [
					{
						type: "text",
						text: "A new paragraph",
					},
				],
			},
			{
				type: "code_block",
				attrs: { id: "code-1", language: "typescript" },
				content: [
					{
						type: "text",
						text: "console.log('hello typescript');",
					},
				],
			},
		],
	};

	// Convert to Uint8Array
	const initial = new TextEncoder().encode(JSON.stringify(initialDoc));
	const update = new TextEncoder().encode(JSON.stringify(afterChange));

	// Create the Lix instance and simulate the file updates
	const changes = await mockChanges({
		file: { id: "mixed-content", path: "/mixed-content.json" },
		fileUpdates: [initial, update],
	});

	// Apply the detected changes back to the initial document
	const { fileData: applied } = applyChanges({
		file: {
			id: "mixed-content",
			path: "/mixed-content.json",
			data: initial,
			metadata: null,
		},
		changes,
	} as ApplyChangesArgs);

	// Parse the document
	const appliedDoc = JSON.parse(new TextDecoder().decode(applied));

	// Verify each node is present with correct structure
	const headingNode = appliedDoc.content.find(
		(node: any) => node.attrs?.id === "heading-1",
	);
	expect(headingNode).toBeDefined();
	expect(headingNode?.attrs?.level).toEqual(2);
	expect(headingNode?.content?.[0]?.text).toEqual("Modified Heading");

	const p1Node = appliedDoc.content.find(
		(node: any) => node.attrs?.id === "p-1",
	);
	expect(p1Node).toBeDefined();
	expect(p1Node?.content?.length).toEqual(2);
	expect(p1Node?.content?.[0]?.text).toEqual("A modified paragraph with ");
	expect(p1Node?.content?.[1]?.text).toEqual("formatting");
	expect(p1Node?.content?.[1]?.marks?.[0]?.type).toEqual("strong");

	const p2Node = appliedDoc.content.find(
		(node: any) => node.attrs?.id === "p-2",
	);
	expect(p2Node).toBeDefined();
	expect(p2Node?.content?.[0]?.text).toEqual("A new paragraph");

	const codeNode = appliedDoc.content.find(
		(node: any) => node.attrs?.id === "code-1",
	);
	expect(codeNode).toBeDefined();
	expect(codeNode?.attrs?.language).toEqual("typescript");
	expect(codeNode?.content?.[0]?.text).toEqual(
		"console.log('hello typescript');",
	);
});
