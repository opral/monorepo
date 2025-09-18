import { expect, test } from "vitest";
import { detectChanges } from "./detectChanges.js";
import type { LixPlugin } from "@lix-js/sdk";

type DetectChangesArgs = Parameters<NonNullable<LixPlugin["detectChanges"]>>[0];

test("it should not detect changes if the document did not update", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "39u49u212" },
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
			],
		}),
	);
	// same file
	const after = before;

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
		},
	} as DetectChangesArgs);
	expect(detectedChanges).toEqual([]);
});

test("it should detect insertion of a new node", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "paragraph-1" },
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
			],
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "paragraph-1" },
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
				{
					type: "paragraph",
					attrs: { id: "paragraph-2" },
					content: [
						{
							type: "text",
							text: "This is a new paragraph.",
						},
					],
				},
			],
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	expect(detectedChanges).toHaveLength(2);

	// Find the document order change
	const documentChange = detectedChanges.find(
		(c) => c.entity_id === "document-root",
	);
	expect(documentChange).toBeDefined();
	expect(documentChange?.snapshot_content).toBeDefined();

	// Find the node change
	const nodeChange = detectedChanges.find((c) => c.entity_id === "paragraph-2");
	expect(nodeChange).toBeDefined();
	expect(nodeChange?.snapshot_content).toBeDefined();
});

test("it should detect modification of an existing node", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "paragraph-1" },
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
			],
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "paragraph-1" },
					content: [
						{
							type: "text",
							text: "Hello, updated world!",
						},
					],
				},
			],
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	expect(detectedChanges).toHaveLength(1);
	const change = detectedChanges[0]!;
	expect(change.entity_id).toEqual("paragraph-1");
	expect(change.snapshot_content).toBeDefined();
	if (change.snapshot_content) {
		expect((change.snapshot_content as any).content[0].text).toEqual(
			"Hello, updated world!",
		);
	}
});

test("it should detect deletion of a node", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "paragraph-1" },
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
				{
					type: "paragraph",
					attrs: { id: "paragraph-2" },
					content: [
						{
							type: "text",
							text: "This paragraph will be deleted.",
						},
					],
				},
			],
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "paragraph-1" },
					content: [
						{
							type: "text",
							text: "Hello, world!",
						},
					],
				},
			],
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	expect(detectedChanges).toHaveLength(2);

	// Find the document order change
	const documentChange = detectedChanges.find(
		(c) => c.entity_id === "document-root",
	);
	expect(documentChange).toBeDefined();
	expect(documentChange?.snapshot_content).toBeDefined();

	// Find the deletion change
	const deleteChange = detectedChanges.find(
		(c) => c.entity_id === "paragraph-2",
	);
	expect(deleteChange).toBeDefined();
	expect(deleteChange?.snapshot_content).toBeNull();
});

test("it should detect multiple changes in a single document", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "paragraph-1" },
					content: [
						{
							type: "text",
							text: "First paragraph",
						},
					],
				},
				{
					type: "paragraph",
					attrs: { id: "paragraph-2" },
					content: [
						{
							type: "text",
							text: "Second paragraph to be modified",
						},
					],
				},
				{
					type: "paragraph",
					attrs: { id: "paragraph-3" },
					content: [
						{
							type: "text",
							text: "Third paragraph to be deleted",
						},
					],
				},
			],
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "paragraph-1" },
					content: [
						{
							type: "text",
							text: "First paragraph",
						},
					],
				},
				{
					type: "paragraph",
					attrs: { id: "paragraph-2" },
					content: [
						{
							type: "text",
							text: "Second paragraph modified",
						},
					],
				},
				{
					type: "paragraph",
					attrs: { id: "paragraph-4" },
					content: [
						{
							type: "text",
							text: "New fourth paragraph",
						},
					],
				},
			],
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	expect(detectedChanges).toHaveLength(4);

	// Find the document order change
	const documentChange = detectedChanges.find(
		(c) => c.entity_id === "document-root",
	);
	expect(documentChange).toBeDefined();
	expect(documentChange?.snapshot_content).toBeDefined();

	// Find each change by entity_id
	const modifiedChange = detectedChanges.find(
		(c) => c.entity_id === "paragraph-2",
	);
	const deletedChange = detectedChanges.find(
		(c) => c.entity_id === "paragraph-3",
	);
	const addedChange = detectedChanges.find(
		(c) => c.entity_id === "paragraph-4",
	);

	expect(modifiedChange).toBeDefined();
	expect(deletedChange).toBeDefined();
	expect(addedChange).toBeDefined();

	// Verify modification
	expect(modifiedChange?.snapshot_content).toBeDefined();
	if (modifiedChange?.snapshot_content) {
		expect((modifiedChange.snapshot_content as any).content[0].text).toEqual(
			"Second paragraph modified",
		);
	}

	// Verify deletion
	expect(deletedChange?.snapshot_content).toBeNull();

	// Verify addition
	expect(addedChange?.snapshot_content).toBeDefined();
	if (addedChange?.snapshot_content) {
		expect((addedChange.snapshot_content as any).content[0].text).toEqual(
			"New fourth paragraph",
		);
	}
});

test("it should detect changes in headings with different levels", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { id: "heading-1", level: 1 },
					content: [
						{
							type: "text",
							text: "Level 1 Heading",
						},
					],
				},
			],
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "heading",
					attrs: { id: "heading-1", level: 2 },
					content: [
						{
							type: "text",
							text: "Level 2 Heading",
						},
					],
				},
			],
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	expect(detectedChanges).toHaveLength(1);
	const change = detectedChanges[0]!;
	expect(change.entity_id).toEqual("heading-1");
	expect(change.snapshot_content).toBeDefined();

	if (change.snapshot_content) {
		expect((change.snapshot_content as any).attrs.level).toEqual(2);
		expect((change.snapshot_content as any).content[0].text).toEqual(
			"Level 2 Heading",
		);
	}
});

test("it should detect changes in text marks", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "paragraph-1" },
					content: [
						{
							type: "text",
							text: "Plain text",
						},
					],
				},
			],
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "paragraph-1" },
					content: [
						{
							type: "text",
							text: "Bold",
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
							text: " text",
						},
					],
				},
			],
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	expect(detectedChanges).toHaveLength(1);
	const change = detectedChanges[0]!;
	expect(change.entity_id).toEqual("paragraph-1");
	expect(change.snapshot_content).toBeDefined();

	if (change.snapshot_content) {
		expect((change.snapshot_content as any).content).toHaveLength(4);
		expect((change.snapshot_content as any).content[0].marks[0].type).toEqual(
			"strong",
		);
		expect((change.snapshot_content as any).content[2].marks[0].type).toEqual(
			"em",
		);
	}
});

test("it should detect changes in complex block structures like lists", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
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
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
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
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	// Should detect: modified item-1, added nested list, added item-3
	expect(detectedChanges.length).toBeGreaterThanOrEqual(2);

	// Expected changes for specific nodes
	const item1Change = detectedChanges.find((c) => c.entity_id === "item-1-p");
	const nestedListChange = detectedChanges.find(
		(c) => c.entity_id === "nested-list",
	);
	const item3Change = detectedChanges.find((c) => c.entity_id === "item-3");

	expect(item1Change).toBeDefined();
	expect(nestedListChange).toBeDefined();
	expect(item3Change).toBeDefined();

	// Verify first item modification
	if (item1Change?.snapshot_content) {
		expect((item1Change.snapshot_content as any).content[0].text).toEqual(
			"First item modified",
		);
	}

	// Verify new nested list
	expect(nestedListChange?.snapshot_content).toBeDefined();

	// Verify new third item
	expect(item3Change?.snapshot_content).toBeDefined();
});

test("it should detect changes in nodes with custom attributes", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "image",
					attrs: {
						id: "image-1",
						src: "old-image.jpg",
						alt: "Old image description",
						title: "Old title",
						width: 300,
						height: 200,
					},
				},
			],
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "image",
					attrs: {
						id: "image-1",
						src: "new-image.jpg",
						alt: "New image description",
						title: "New title",
						width: 400,
						height: 300,
					},
				},
			],
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	expect(detectedChanges).toHaveLength(1);
	const change = detectedChanges[0]!;
	expect(change.entity_id).toEqual("image-1");
	expect(change.snapshot_content).toBeDefined();

	if (change.snapshot_content) {
		expect((change.snapshot_content as any).attrs.src).toEqual("new-image.jpg");
		expect((change.snapshot_content as any).attrs.alt).toEqual(
			"New image description",
		);
		expect((change.snapshot_content as any).attrs.width).toEqual(400);
		expect((change.snapshot_content as any).attrs.height).toEqual(300);
	}
});

test("it should detect changes in tables", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
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
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
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
											content: [
												{ type: "text", text: "Row 1, Cell 1 modified" },
											],
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
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	// Should at minimum detect: changed cell-1-1-p and added row-2
	expect(detectedChanges.length).toBeGreaterThanOrEqual(2);

	// Find changes for specific elements
	const cell11Change = detectedChanges.find(
		(c) => c.entity_id === "cell-1-1-p",
	);
	const row2Change = detectedChanges.find((c) => c.entity_id === "row-2");

	expect(cell11Change).toBeDefined();
	expect(row2Change).toBeDefined();

	// Verify cell-1-1 modification
	if (cell11Change?.snapshot_content) {
		expect((cell11Change.snapshot_content as any).content[0].text).toEqual(
			"Row 1, Cell 1 modified",
		);
	}

	// Verify new row-2 addition
	expect(row2Change?.snapshot_content).toBeDefined();
});

test("it should detect changes in code blocks", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "code_block",
					attrs: {
						id: "code-1",
						language: "javascript",
					},
					content: [
						{
							type: "text",
							text: "function hello() {\n  console.log('Hello');\n}",
						},
					],
				},
			],
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "code_block",
					attrs: {
						id: "code-1",
						language: "typescript",
					},
					content: [
						{
							type: "text",
							text: "function hello(): void {\n  console.log('Hello, world!');\n}",
						},
					],
				},
			],
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	expect(detectedChanges).toHaveLength(1);
	const change = detectedChanges[0]!;
	expect(change.entity_id).toEqual("code-1");
	expect(change.snapshot_content).toBeDefined();

	if (change.snapshot_content) {
		expect((change.snapshot_content as any).attrs.language).toEqual(
			"typescript",
		);
		expect((change.snapshot_content as any).content[0].text).toContain(
			"function hello(): void",
		);
	}
});

test("it should detect changes in blockquotes", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
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
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
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
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	// Should detect changes in quote-p-1, addition of quote-p-2, and possibly the parent quote-1
	expect(detectedChanges.length).toBeGreaterThanOrEqual(2);

	const quoteParagraph1Change = detectedChanges.find(
		(c) => c.entity_id === "quote-p-1",
	);
	const quoteParagraph2Change = detectedChanges.find(
		(c) => c.entity_id === "quote-p-2",
	);

	expect(quoteParagraph1Change).toBeDefined();
	expect(quoteParagraph2Change).toBeDefined();

	// Verify paragraph 1 modification
	if (quoteParagraph1Change?.snapshot_content) {
		expect(
			(quoteParagraph1Change.snapshot_content as any).content[0].text,
		).toEqual("Modified quote text");
	}

	// Verify paragraph 2 addition
	expect(quoteParagraph2Change?.snapshot_content).toBeDefined();
	if (quoteParagraph2Change?.snapshot_content) {
		expect(
			(quoteParagraph2Change.snapshot_content as any).content[0].text,
		).toEqual("Additional paragraph in quote");
	}
});

test("it should detect changes in links", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "p-1" },
					content: [
						{
							type: "text",
							text: "Visit ",
						},
						{
							type: "text",
							text: "old link",
							marks: [
								{
									type: "link",
									attrs: {
										href: "https://old-example.com",
										title: "Old title",
									},
								},
							],
						},
						{
							type: "text",
							text: " for more information.",
						},
					],
				},
			],
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "paragraph",
					attrs: { id: "p-1" },
					content: [
						{
							type: "text",
							text: "Visit ",
						},
						{
							type: "text",
							text: "new link",
							marks: [
								{
									type: "link",
									attrs: {
										href: "https://new-example.com",
										title: "New title",
									},
								},
							],
						},
						{
							type: "text",
							text: " for more information.",
						},
					],
				},
			],
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	expect(detectedChanges).toHaveLength(1);
	const change = detectedChanges[0]!;
	expect(change.entity_id).toEqual("p-1");
	expect(change.snapshot_content).toBeDefined();

	if (change.snapshot_content) {
		const linkNode = (change.snapshot_content as any).content[1];
		expect(linkNode.text).toEqual("new link");
		expect(linkNode.marks[0].attrs.href).toEqual("https://new-example.com");
		expect(linkNode.marks[0].attrs.title).toEqual("New title");
	}
});

test("it should NOT report changes for parent nodes when only children change", async () => {
	const before = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "description",
					attrs: {
						dragHandlesDisabled: true,
						id: "fc82493d-d5d6-4a36-9c25-2a8eb1c25de9",
					},
					content: [
						{
							type: "paragraph",
							attrs: {
								id: "854220ed-a3ec-4c27-86b2-8a27d46e3e34",
							},
							content: [
								{
									type: "text",
									text: "hello world",
								},
							],
						},
					],
				},
			],
		}),
	);

	const after = new TextEncoder().encode(
		JSON.stringify({
			type: "doc",
			content: [
				{
					type: "description",
					attrs: {
						dragHandlesDisabled: true,
						id: "fc82493d-d5d6-4a36-9c25-2a8eb1c25de9",
					},
					content: [
						{
							type: "paragraph",
							attrs: {
								id: "854220ed-a3ec-4c27-86b2-8a27d46e3e34",
							},
							content: [
								{
									type: "text",
									text: "hello world, how are you?", // Text changed here
								},
							],
						},
					],
				},
			],
		}),
	);

	const detectedChanges = detectChanges?.({
		before: {
			id: "random",
			path: "prosemirror.json",
			data: before,
			metadata: null,
		},
		after: {
			id: "random",
			path: "prosemirror.json",
			data: after,
			metadata: null,
		},
	} as DetectChangesArgs);

	// We expect only the paragraph to be reported as changed, not the description
	expect(detectedChanges).toHaveLength(1);
	const change = detectedChanges[0]!;

	// The paragraph should be reported as changed
	expect(change.entity_id).toEqual("854220ed-a3ec-4c27-86b2-8a27d46e3e34");

	// The description should NOT be reported as changed
	const descriptionChange = detectedChanges.find(
		(c) => c.entity_id === "fc82493d-d5d6-4a36-9c25-2a8eb1c25de9",
	);
	expect(descriptionChange).toBeUndefined();
});
