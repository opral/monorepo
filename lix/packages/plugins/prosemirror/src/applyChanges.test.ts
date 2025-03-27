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
	const { lix, changes } = await mockChanges({
		file: { id: "prosemirror-doc", path: "/prosemirror.json" },
		fileUpdates: [before, firstUpdate, secondUpdate, thirdUpdate, fourthUpdate],
	});

	// Apply the detected changes back to the initial document
	const { fileData: applied } = await applyChanges({
		lix,
		file: {
			id: "prosemirror-doc",
			path: "/prosemirror.json",
			data: before,
			metadata: null,
		},
		changes,
	});

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
	const { lix, changes } = await mockChanges({
		file: { id: "test-doc-crud", path: "/test-crud.json" },
		fileUpdates: [initial, firstUpdate, secondUpdate],
	});

	// Apply the detected changes back to the initial document
	const { fileData: applied } = await applyChanges({
		lix,
		file: {
			id: "test-doc-crud",
			path: "/test-crud.json",
			data: initial,
			metadata: null,
		},
		changes,
	});

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
	const { lix, changes } = await mockChanges({
		file: { id: "text-with-marks", path: "/text-with-marks.json" },
		fileUpdates: [initial, update],
	});

	// Apply the detected changes back to the initial document
	const { fileData: applied } = await applyChanges({
		lix,
		file: {
			id: "text-with-marks",
			path: "/text-with-marks.json",
			data: initial,
			metadata: null,
		},
		changes,
	});

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

// Test changes to nested structures like lists
test("it correctly applies changes to nested list structures", async () => {
	// Initial document with simple list
	const initialDoc = {
		type: "doc",
		content: [
			{
				type: "bullet_list",
				attrs: { id: "list-1" },
				content: [
					{
						type: "list_item",
						attrs: { id: "item-1" },
						content: [
							{
								type: "paragraph",
								attrs: { id: "item-1-p" },
								content: [{ type: "text", text: "First item" }],
							},
						],
					},
					{
						type: "list_item",
						attrs: { id: "item-2" },
						content: [
							{
								type: "paragraph",
								attrs: { id: "item-2-p" },
								content: [{ type: "text", text: "Second item" }],
							},
						],
					},
				],
			},
		],
	};

	// Update with nested list and modified first item
	const afterChange = {
		type: "doc",
		content: [
			{
				type: "bullet_list",
				attrs: { id: "list-1" },
				content: [
					{
						type: "list_item",
						attrs: { id: "item-1" },
						content: [
							{
								type: "paragraph",
								attrs: { id: "item-1-p" },
								content: [{ type: "text", text: "First item modified" }],
							},
						],
					},
					{
						type: "list_item",
						attrs: { id: "item-2" },
						content: [
							{
								type: "paragraph",
								attrs: { id: "item-2-p" },
								content: [{ type: "text", text: "Second item" }],
							},
							{
								type: "bullet_list",
								attrs: { id: "nested-list" },
								content: [
									{
										type: "list_item",
										attrs: { id: "nested-item-1" },
										content: [
											{
												type: "paragraph",
												attrs: { id: "nested-p" },
												content: [{ type: "text", text: "Nested item" }],
											},
										],
									},
								],
							},
						],
					},
					{
						type: "list_item",
						attrs: { id: "item-3" },
						content: [
							{
								type: "paragraph",
								attrs: { id: "item-3-p" },
								content: [{ type: "text", text: "New third item" }],
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
	const { lix, changes } = await mockChanges({
		file: { id: "nested-list", path: "/nested-list.json" },
		fileUpdates: [initial, update],
	});

	// Apply the detected changes back to the initial document
	const { fileData: applied } = await applyChanges({
		lix,
		file: {
			id: "nested-list",
			path: "/nested-list.json",
			data: initial,
			metadata: null,
		},
		changes,
	});

	// Parse the applied document
	const appliedDoc = JSON.parse(new TextDecoder().decode(applied));

	// Define the expected structure explicitly to avoid inconsistencies with test files
	const expectedNestedListDoc = {
		type: "doc",
		content: [
			{
				type: "bullet_list",
				attrs: { id: "list-1" },
				content: [
					{
						type: "list_item",
						attrs: { id: "item-1" },
						content: [
							{
								type: "paragraph",
								attrs: { id: "item-1-p" },
								content: [{ type: "text", text: "First item modified" }],
							},
						],
					},
					{
						type: "list_item",
						attrs: { id: "item-2" },
						content: [
							{
								type: "paragraph",
								attrs: { id: "item-2-p" },
								content: [{ type: "text", text: "Second item" }],
							},
							{
								type: "bullet_list",
								attrs: { id: "nested-list" },
								content: [
									{
										type: "list_item",
										attrs: { id: "nested-item-1" },
										content: [
											{
												type: "paragraph",
												attrs: { id: "nested-p" },
												content: [{ type: "text", text: "Nested item" }],
											},
										],
									},
								],
							},
						],
					},
					{
						type: "list_item",
						attrs: { id: "item-3" },
						content: [
							{
								type: "paragraph",
								attrs: { id: "item-3-p" },
								content: [{ type: "text", text: "New third item" }],
							},
						],
					},
				],
			},
		],
	};

	// Check content structure (ignore exact order of top-level elements)
	expect(appliedDoc.type).toEqual("doc");
	expect(appliedDoc.content).toContainEqual(expectedNestedListDoc.content[0]);
});

// Test changes to complex block structures like tables
test("it correctly applies changes to tables", async () => {
	// Initial document with simple table
	const initialDoc = {
		type: "doc",
		content: [
			{
				type: "table",
				attrs: { id: "table-1" },
				content: [
					{
						type: "table_row",
						attrs: { id: "row-1" },
						content: [
							{
								type: "table_cell",
								attrs: { id: "cell-1-1" },
								content: [
									{
										type: "paragraph",
										attrs: { id: "cell-1-1-p" },
										content: [{ type: "text", text: "Row 1, Cell 1" }],
									},
								],
							},
							{
								type: "table_cell",
								attrs: { id: "cell-1-2" },
								content: [
									{
										type: "paragraph",
										attrs: { id: "cell-1-2-p" },
										content: [{ type: "text", text: "Row 1, Cell 2" }],
									},
								],
							},
						],
					},
				],
			},
		],
	};

	// Update with modified cell and new row
	const afterChange = {
		type: "doc",
		content: [
			{
				type: "table",
				attrs: { id: "table-1" },
				content: [
					{
						type: "table_row",
						attrs: { id: "row-1" },
						content: [
							{
								type: "table_cell",
								attrs: { id: "cell-1-1" },
								content: [
									{
										type: "paragraph",
										attrs: { id: "cell-1-1-p" },
										content: [{ type: "text", text: "Row 1, Cell 1 modified" }],
									},
								],
							},
							{
								type: "table_cell",
								attrs: { id: "cell-1-2" },
								content: [
									{
										type: "paragraph",
										attrs: { id: "cell-1-2-p" },
										content: [{ type: "text", text: "Row 1, Cell 2" }],
									},
								],
							},
						],
					},
					{
						type: "table_row",
						attrs: { id: "row-2" },
						content: [
							{
								type: "table_cell",
								attrs: { id: "cell-2-1" },
								content: [
									{
										type: "paragraph",
										attrs: { id: "cell-2-1-p" },
										content: [{ type: "text", text: "Row 2, Cell 1" }],
									},
								],
							},
							{
								type: "table_cell",
								attrs: { id: "cell-2-2" },
								content: [
									{
										type: "paragraph",
										attrs: { id: "cell-2-2-p" },
										content: [{ type: "text", text: "Row 2, Cell 2" }],
									},
								],
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
	const { lix, changes } = await mockChanges({
		file: { id: "table-doc", path: "/table-doc.json" },
		fileUpdates: [initial, update],
	});

	// Apply the detected changes back to the initial document
	const { fileData: applied } = await applyChanges({
		lix,
		file: {
			id: "table-doc",
			path: "/table-doc.json",
			data: initial,
			metadata: null,
		},
		changes,
	});

	// Parse the document
	const appliedDoc = JSON.parse(new TextDecoder().decode(applied));

	// Define the expected structure explicitly
	const expectedTableDoc = {
		type: "doc",
		content: [
			{
				type: "table",
				attrs: { id: "table-1" },
				content: [
					{
						type: "table_row",
						attrs: { id: "row-1" },
						content: [
							{
								type: "table_cell",
								attrs: { id: "cell-1-1" },
								content: [
									{
										type: "paragraph",
										attrs: { id: "cell-1-1-p" },
										content: [{ type: "text", text: "Row 1, Cell 1 modified" }],
									},
								],
							},
							{
								type: "table_cell",
								attrs: { id: "cell-1-2" },
								content: [
									{
										type: "paragraph",
										attrs: { id: "cell-1-2-p" },
										content: [{ type: "text", text: "Row 1, Cell 2" }],
									},
								],
							},
						],
					},
					{
						type: "table_row",
						attrs: { id: "row-2" },
						content: [
							{
								type: "table_cell",
								attrs: { id: "cell-2-1" },
								content: [
									{
										type: "paragraph",
										attrs: { id: "cell-2-1-p" },
										content: [{ type: "text", text: "Row 2, Cell 1" }],
									},
								],
							},
							{
								type: "table_cell",
								attrs: { id: "cell-2-2" },
								content: [
									{
										type: "paragraph",
										attrs: { id: "cell-2-2-p" },
										content: [{ type: "text", text: "Row 2, Cell 2" }],
									},
								],
							},
						],
					},
				],
			},
		],
	};

	// Check content structure
	expect(appliedDoc.type).toEqual("doc");
	expect(appliedDoc.content).toContainEqual(expectedTableDoc.content[0]);
});

// Test changes to blockquotes
test("it correctly applies changes to blockquotes", async () => {
	// Initial document with simple blockquote
	const initialDoc = {
		type: "doc",
		content: [
			{
				type: "blockquote",
				attrs: { id: "quote-1" },
				content: [
					{
						type: "paragraph",
						attrs: { id: "quote-p-1" },
						content: [
							{
								type: "text",
								text: "Original quote text",
							},
						],
					},
				],
			},
		],
	};

	// Update with modified blockquote and new paragraph
	const afterChange = {
		type: "doc",
		content: [
			{
				type: "blockquote",
				attrs: { id: "quote-1" },
				content: [
					{
						type: "paragraph",
						attrs: { id: "quote-p-1" },
						content: [
							{
								type: "text",
								text: "Modified quote text",
							},
						],
					},
					{
						type: "paragraph",
						attrs: { id: "quote-p-2" },
						content: [
							{
								type: "text",
								text: "Additional paragraph in quote",
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
	const { lix, changes } = await mockChanges({
		file: { id: "blockquote-doc", path: "/blockquote-doc.json" },
		fileUpdates: [initial, update],
	});

	// Apply the detected changes back to the initial document
	const { fileData: applied } = await applyChanges({
		lix,
		file: {
			id: "blockquote-doc",
			path: "/blockquote-doc.json",
			data: initial,
			metadata: null,
		},
		changes,
	});

	// Parse the document
	const appliedDoc = JSON.parse(new TextDecoder().decode(applied));

	// Define the expected structure explicitly
	const expectedBlockquoteDoc = {
		type: "doc",
		content: [
			{
				type: "blockquote",
				attrs: { id: "quote-1" },
				content: [
					{
						type: "paragraph",
						attrs: { id: "quote-p-1" },
						content: [
							{
								type: "text",
								text: "Modified quote text",
							},
						],
					},
					{
						type: "paragraph",
						attrs: { id: "quote-p-2" },
						content: [
							{
								type: "text",
								text: "Additional paragraph in quote",
							},
						],
					},
				],
			},
		],
	};

	// Check content structure
	expect(appliedDoc.type).toEqual("doc");
	expect(appliedDoc.content).toContainEqual(expectedBlockquoteDoc.content[0]);
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
	const { lix, changes } = await mockChanges({
		file: { id: "mixed-content", path: "/mixed-content.json" },
		fileUpdates: [initial, update],
	});

	// Apply the detected changes back to the initial document
	const { fileData: applied } = await applyChanges({
		lix,
		file: {
			id: "mixed-content",
			path: "/mixed-content.json",
			data: initial,
			metadata: null,
		},
		changes,
	});

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
