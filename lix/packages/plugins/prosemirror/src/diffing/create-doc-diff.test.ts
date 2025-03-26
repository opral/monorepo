import { expect, test } from "vitest";
import { createDocDiff } from "./create-doc-diff.js";
import type { DiffNode } from "./create-doc-diff.js";

// Test case 1: Node added in the after document
test("should mark new nodes as created", () => {
	const beforeDoc = {
		type: "doc",
		attrs: { id: "doc1" },
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Hello" }],
			},
		],
	};

	const afterDoc = {
		type: "doc",
		attrs: { id: "doc1" },
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Hello" }],
			},
			{
				type: "paragraph",
				attrs: { id: "p2" },
				content: [{ type: "text", text: "World" }],
			},
		],
	};

	const result = createDocDiff(beforeDoc, afterDoc);

	// The root document should be marked as updated
	expect(result.attrs?.diff).toBe("updated");

	// The first paragraph should be unmodified
	expect(result.content?.[0]?.attrs?.diff).toBe("unmodified");

	// The second paragraph should be marked as created
	expect(result.content?.[1]?.attrs?.diff).toBe("created");

	// The text node in the second paragraph should be marked as created
	expect(result.content?.[1]?.content?.[0]?.attrs?.diff).toBe("created");
});

// Test case 2: Node removed in the after document
test("should mark removed nodes as deleted", () => {
	const beforeDoc = {
		type: "doc",
		attrs: { id: "doc1" },
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Hello" }],
			},
			{
				type: "paragraph",
				attrs: { id: "p2" },
				content: [{ type: "text", text: "World" }],
			},
		],
	};

	const afterDoc = {
		type: "doc",
		attrs: { id: "doc1" },
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Hello" }],
			},
		],
	};

	const result = createDocDiff(beforeDoc, afterDoc);

	// The root document should be marked as updated
	expect(result.attrs?.diff).toBe("updated");

	// The first paragraph should be unmodified
	expect(result.content?.[0]?.attrs?.diff).toBe("unmodified");

	// The second paragraph should be marked as deleted
	// Note: In our implementation, deleted nodes are included in the merged AST
	const deletedNode = findNodeById(result, "p2");
	expect(deletedNode).toBeDefined();
	expect(deletedNode?.attrs?.diff).toBe("deleted");
});

// Test case 3: Node modified in the after document
test("should mark modified nodes as updated", () => {
	const beforeDoc = {
		type: "doc",
		attrs: { id: "doc1" },
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Hello" }],
			},
		],
	};

	const afterDoc = {
		type: "doc",
		attrs: { id: "doc1" },
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Hello World" }],
			},
		],
	};

	const result = createDocDiff(beforeDoc, afterDoc);

	// The text node should be marked as updated
	const textNode = findTextInParagraph(result, "p1");
	expect(textNode).toBeDefined();
	expect(textNode?.attrs?.diff).toBe("updated");
	expect(textNode?.text).toBe("Hello World");
});

// Test case 4: Complex document with multiple changes
test("should handle complex documents with multiple changes", () => {
	const beforeDoc = {
		type: "doc",
		attrs: { id: "doc1" },
		content: [
			{
				type: "heading",
				attrs: { id: "h1", level: 1 },
				content: [{ type: "text", text: "Title" }],
			},
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [
					{ type: "text", text: "First paragraph" },
				],
			},
			{
				type: "paragraph",
				attrs: { id: "p2" },
				content: [
					{ type: "text", text: "Second paragraph" },
				],
			},
		],
	};

	const afterDoc = {
		type: "doc",
		attrs: { id: "doc1" },
		content: [
			{
				type: "heading",
				attrs: { id: "h1", level: 2 }, // Changed level
				content: [{ type: "text", text: "New Title" }], // Changed text
			},
			// p1 removed
			{
				type: "paragraph",
				attrs: { id: "p2" },
				content: [
					{ type: "text", text: "Second paragraph" },
				],
			},
			{
				type: "paragraph",
				attrs: { id: "p3" },
				content: [{ type: "text", text: "New paragraph" }],
			},
		],
	};

	const result = createDocDiff(beforeDoc, afterDoc);

	// Check heading changes
	const heading = findNodeById(result, "h1");
	expect(heading?.attrs?.diff).toBe("updated");
	expect(heading?.attrs?.level).toBe(2);

	// Check heading text changes
	const headingText = heading?.content?.[0];
	expect(headingText?.attrs?.diff).toBe("updated");
	expect(headingText?.text).toBe("New Title");

	// Check deleted paragraph
	const deletedParagraph = findNodeById(result, "p1");
	expect(deletedParagraph).toBeDefined();
	expect(deletedParagraph?.attrs?.diff).toBe("deleted");

	// Check unmodified paragraph
	const unmodifiedParagraph = findNodeById(result, "p2");
	expect(unmodifiedParagraph?.attrs?.diff).toBe("unmodified");

	// Check new paragraph
	const newParagraph = findNodeById(result, "p3");
	expect(newParagraph?.attrs?.diff).toBe("created");
});

// Test case 5: Empty documents
test("should handle empty documents", () => {
	const emptyDoc = {
		type: "doc",
		attrs: { id: "doc1" },
		content: [],
	};

	const nonEmptyDoc = {
		type: "doc",
		attrs: { id: "doc1" },
		content: [
			{
				type: "paragraph",
				attrs: { id: "p1" },
				content: [{ type: "text", text: "Hello" }],
			},
		],
	};

	// Empty -> Non-empty
	const result1 = createDocDiff(emptyDoc, nonEmptyDoc);
	expect(result1.attrs?.diff).toBe("updated");
	expect(result1.content?.[0]?.attrs?.diff).toBe("created");

	// Non-empty -> Empty
	const result2 = createDocDiff(nonEmptyDoc, emptyDoc);
	expect(result2.attrs?.diff).toBe("updated");

	// Find the deleted paragraph (it should be included in the merged AST)
	const deletedParagraph = findNodeById(result2, "p1");
	expect(deletedParagraph?.attrs?.diff).toBe("deleted");
});

// Test case 6: Detect text changes with spaces and commas
test("should detect text changes with spaces and commas", () => {
	// Main document (before)
	const beforeDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: {
					id: "a02fc822-98c0-4845-a0e6-6cc0d00e27bb"
				},
				content: [
					{
						type: "text",
						text: "hello  world"
					}
				]
			}
		]
	};

	// Proposal document (after)
	const afterDoc = {
		type: "doc",
		content: [
			{
				type: "paragraph",
				attrs: {
					id: "a02fc822-98c0-4845-a0e6-6cc0d00e27bb"
				},
				content: [
					{
						type: "text",
						text: "hello  world, yes"
					}
				]
			}
		]
	};

	// Create the diff
	const result = createDocDiff(beforeDoc, afterDoc);

	// The document should be marked as updated
	expect(result.attrs?.diff).toBe("updated");

	// The paragraph should be marked as updated
	const paragraph = findNodeById(result, "a02fc822-98c0-4845-a0e6-6cc0d00e27bb");
	expect(paragraph).toBeDefined();
	expect(paragraph?.attrs?.diff).toBe("updated");

	// The text node should be marked as updated
	expect(paragraph?.content?.[0]?.attrs?.diff).toBe("updated");
	expect(paragraph?.content?.[0]?.text).toBe("hello  world, yes");
});

/**
 * Helper function to find a node by ID in the merged AST
 */
function findNodeById(root: DiffNode, id: string): DiffNode | undefined {
	if (root.attrs?.id === id) {
		return root;
	}

	if (!root.content) {
		return undefined;
	}

	for (const child of root.content) {
		const found = findNodeById(child, id);
		if (found) {
			return found;
		}
	}

	return undefined;
}

/**
 * Helper function to find a text node inside a paragraph with a specific ID
 */
function findTextInParagraph(root: DiffNode, paragraphId: string): DiffNode | undefined {
	const paragraph = findNodeById(root, paragraphId);
	if (paragraph?.content?.[0]?.type === "text") {
		return paragraph.content[0];
	}
	return undefined;
}