# Lix-Plugin-MD Specification

## Overview

The lix-plugin-md is a plugin for the Lix SDK that provides change detection and application capabilities for Markdown files. The plugin operates on MD-AST (Markdown Abstract Syntax Tree) using remark-gfm and remark-frontmatter, with each AST node enhanced with a unique `mdast_id` property for tracking changes.

## Architecture

### Core Processing Flow

```
Markdown File → MD-AST (with mdast_id properties) → Change Detection → Lix Changes
                    ↑                                                  ↓
                    ← MD-AST (reconstructed) ← Apply Changes ←─────────┘
```

### Dependencies

- `unified`: Core processing engine
- `remark-parse`: Markdown parsing
- `remark-stringify`: Markdown serialization
- `remark-gfm`: GitHub Flavored Markdown support
- `remark-frontmatter`: Frontmatter handling
- `unist-util-visit`: AST traversal

## ID Management System

### HTML Comment Format

ID comments are embedded in markdown as HTML comments using the format:

```html
<!-- mdast_id = {nodeId} -->
```

### Node ID Property

Each AST node receives a `mdast_id` property containing its unique identifier:

```javascript
{
  type: "paragraph",
  children: [...],
  mdast_id: "abc123"
}
```

### ID Generation Strategy

1. **Existing IDs**: Extract from preceding HTML comments
2. **New IDs**: Generate using `generateNodeId(node)` function
3. **ID Format**: Alphanumeric string, potentially based on content hash

## Transformation Processes

### Markdown → MD-AST

```javascript
function parseMarkdown(markdown) {
	const ast = unified()
		.use(remarkParse)
		.use(remarkGfm) // GitHub Flavored Markdown
		.use(remarkFrontmatter) // Frontmatter support
		.parse(markdown);

	return enrichWithIds(ast);
}

function enrichWithIds(ast) {
	let previousNode = null;
	const processedNodes = [];

	for (const node of ast.children) {
		// Skip HTML ID comments, extract ID for next node
		if (isHtmlIdComment(node)) {
			previousNode = node;
			continue;
		}

		// Assign ID to current node
		const nodeId =
			previousNode && isHtmlIdComment(previousNode)
				? parseHtmlIdComment(previousNode.value)
				: generateNodeId(node);

		processedNodes.push({
			...node,
			mdast_id: nodeId,
		});

		previousNode = null;
	}

	return {
		...ast,
		children: processedNodes,
	};
}
```

### MD-AST → Markdown

```javascript
function serializeMarkdown(ast, options = {}) {
	const children = [];

	for (const node of ast.children) {
		// Add ID comment unless skipped
		if (!options.skipmdast_id_comments && node.mdast_id) {
			children.push({
				type: "html",
				value: `<!-- mdast_id = ${node.mdast_id} -->`,
			});
		}

		// Add the actual node (without mdast_id property)
		const { mdast_id, ...nodeWithoutId } = node;
		children.push(nodeWithoutId);
	}

	return unified()
		.use(remarkStringify)
		.use(remarkGfm)
		.use(remarkFrontmatter)
		.stringify({
			...ast,
			children,
		});
}
```

## Change Detection

### Process Overview

```javascript
function detectChanges({ before, after }) {
	const beforeAst = parseMarkdown(before);
	const afterAst = parseMarkdown(after);

	const beforeNodes = new Map();
	const afterNodes = new Map();
	const beforeOrder = [];
	const afterOrder = [];

	// Build node maps and order arrays
	for (const node of beforeAst.children) {
		beforeNodes.set(node.mdast_id, node);
		beforeOrder.push(node.mdast_id);
	}

	for (const node of afterAst.children) {
		afterNodes.set(node.mdast_id, node);
		afterOrder.push(node.mdast_id);
	}

	return generateDetectedChanges(
		beforeNodes,
		afterNodes,
		beforeOrder,
		afterOrder,
	);
}
```

### Change Types

1. **Inserted Nodes**: Present in `after` but not in `before`
2. **Removed Nodes**: Present in `before` but not in `after`
3. **Modified Nodes**: Present in both but with different content
4. **Reordered Nodes**: Same nodes but different order

### DetectedChange Structure

```javascript
{
  entitymdast_id: string,        // Node ID
  schema_key: string,       // Node type
  snapshot_content: object | null  // New content or null for deletions
}
```

### Order Change Detection

When node order changes, a special root entity change is generated:

```javascript
{
  entitymdast_id: "root",
  schema_key: "root",
  snapshot_content: {
    order: string[]  // Array of node IDs in new order
  }
}
```

## Apply Changes

### Process Overview

```javascript
function applyChanges({ changes, fileId, lix }) {
	// Extract order from root change
	const orderChange = changes.find((c) => c.schema_key === "root");
	const order = orderChange?.snapshot_content?.order || [];

	// Build new AST from changes
	const ast = {
		type: "root",
		children: [],
	};

	for (const nodeId of order) {
		const change = changes.find((c) => c.entitymdast_id === nodeId);

		if (change?.snapshot_content) {
			// Add ID comment if not skipped
			if (!file.metadata?.skipmdast_id_comments) {
				ast.children.push({
					type: "html",
					value: `<!-- mdast_id = ${nodeId} -->`,
				});
			}

			// Add the actual node
			ast.children.push(change.snapshot_content);
		}
	}

	return serializeMarkdown(ast, file.metadata);
}
```

## Schema Definitions

### Node Schema

```javascript
export const MarkdownNodeSchemaV1 = {
	"x-lix-key": "lix_plugin_md_node",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		mdast_id: { type: "string" },
		type: {
			type: "string",
			enum: [
				"paragraph",
				"heading",
				"list",
				"listItem",
				"code",
				"blockquote",
				"table",
				"tableRow",
				"tableCell",
				"hr",
				"html",
				"image",
				"link",
				"emphasis",
				"strong",
				"delete",
				"inlineCode",
				"break",
				"text",
			],
		},
		children: {
			type: "array",
			items: { $ref: "#" }, // Recursive reference
		},
		// Additional properties based on node type
		value: { type: "string" }, // For text, code, html nodes
		depth: { type: "number" }, // For heading nodes
		ordered: { type: "boolean" }, // For list nodes
		url: { type: "string" }, // For link, image nodes
		alt: { type: "string" }, // For image nodes
		title: { type: "string" }, // For link, image nodes
	},
	required: ["mdast_id", "type"],
	additionalProperties: false,
};
```

### Root Order Schema

```javascript
export const MarkdownRootSchemaV1 = {
	"x-lix-key": "lix_plugin_md_root",
	"x-lix-version": "1.0",
	type: "object",
	properties: {
		order: {
			type: "array",
			items: { type: "string" },
		},
	},
	required: ["order"],
	additionalProperties: false,
};
```

## Test Cases

### Markdown ↔ MD-AST Transformation Tests

#### Test 1: Basic Transformation

```javascript
describe("markdown to ast transformation", () => {
	test("preserves existing IDs", () => {
		const markdown = `
<!-- mdast_id = heading-1 -->
# Hello World

<!-- mdast_id = para-1 -->
This is a paragraph.
`;

		const ast = parseMarkdown(markdown);
		expect(ast.children[0].mdast_id).toBe("heading-1");
		expect(ast.children[1].mdast_id).toBe("para-1");
	});

	test("generates IDs for nodes without comments", () => {
		const markdown = `
# Hello World
This is a paragraph.
`;

		const ast = parseMarkdown(markdown);
		expect(ast.children[0].mdast_id).toBeTruthy();
		expect(ast.children[1].mdast_id).toBeTruthy();
		expect(ast.children[0].mdast_id).not.toBe(ast.children[1].mdast_id);
	});
});
```

#### Test 2: AST to Markdown Transformation

```javascript
describe("ast to markdown transformation", () => {
	test("adds ID comments by default", () => {
		const ast = {
			type: "root",
			children: [
				{
					type: "heading",
					depth: 1,
					children: [{ type: "text", value: "Hello" }],
					mdast_id: "heading-1",
				},
			],
		};

		const markdown = serializeMarkdown(ast);
		expect(markdown).toContain("<!-- mdast_id = heading-1 -->");
		expect(markdown).toContain("# Hello");
	});

	test("skips ID comments when configured", () => {
		const ast = {
			type: "root",
			children: [
				{
					type: "heading",
					depth: 1,
					children: [{ type: "text", value: "Hello" }],
					mdast_id: "heading-1",
				},
			],
		};

		const markdown = serializeMarkdown(ast, { skipmdast_id_comments: true });
		expect(markdown).not.toContain("<!-- mdast_id = heading-1 -->");
		expect(markdown).toContain("# Hello");
	});
});
```

### Change Detection Tests

#### Test 3: Node Insertion

```javascript
describe("change detection", () => {
	test("detects inserted nodes", () => {
		const before = "# Hello";
		const after = `
# Hello
New paragraph
`;

		const changes = detectChanges({ before, after });
		const insertedChange = changes.find(
			(c) => c.snapshot_content?.type === "paragraph",
		);

		expect(insertedChange).toBeTruthy();
		expect(insertedChange.snapshot_content.children[0].value).toBe(
			"New paragraph",
		);
	});
});
```

#### Test 4: Node Removal

```javascript
test("detects removed nodes", () => {
	const before = `
# Hello
Old paragraph
`;
	const after = "# Hello";

	const changes = detectChanges({ before, after });
	const removedChange = changes.find((c) => c.snapshot_content === null);

	expect(removedChange).toBeTruthy();
});
```

#### Test 5: Node Modification

```javascript
test("detects modified nodes", () => {
	const before = "# Hello World";
	const after = "# Hello Universe";

	const changes = detectChanges({ before, after });
	const modifiedChange = changes.find(
		(c) => c.snapshot_content?.type === "heading",
	);

	expect(modifiedChange).toBeTruthy();
	expect(modifiedChange.snapshot_content.children[0].value).toBe(
		"Hello Universe",
	);
});
```

#### Test 6: Node Reordering

```javascript
test("detects node reordering", () => {
	const before = `
<!-- mdast_id = para-1 -->
First paragraph

<!-- mdast_id = para-2 -->
Second paragraph
`;

	const after = `
<!-- mdast_id = para-2 -->
Second paragraph

<!-- mdast_id = para-1 -->
First paragraph
`;

	const changes = detectChanges({ before, after });
	const orderChange = changes.find((c) => c.schema_key === "root");

	expect(orderChange).toBeTruthy();
	expect(orderChange.snapshot_content.order).toEqual(["para-2", "para-1"]);
});
```

### Apply Changes Tests

#### Test 7: Apply Node Changes

```javascript
describe("apply changes", () => {
	test("applies inserted nodes", () => {
		const changes = [
			{
				entitymdast_id: "root",
				schema_key: "root",
				snapshot_content: {
					order: ["heading-1", "para-1"],
				},
			},
			{
				entitymdast_id: "para-1",
				schema_key: "paragraph",
				snapshot_content: {
					type: "paragraph",
					children: [{ type: "text", value: "New paragraph" }],
					mdast_id: "para-1",
				},
			},
		];

		const result = applyChanges({ changes, fileId: "test", lix: mockLix });
		expect(result.fileData).toContain("New paragraph");
	});
});
```

### Integration Tests

#### Test 8: Round-trip Consistency

```javascript
describe("integration tests", () => {
	test("round-trip preserves content", () => {
		const original = `
# Title

This is a **bold** paragraph with [a link](https://example.com).

\`\`\`javascript
console.log("Hello");
\`\`\`

- Item 1
- Item 2
`;

		// Parse and serialize
		const ast = parseMarkdown(original);
		const serialized = serializeMarkdown(ast);

		// Parse again to verify consistency
		const ast2 = parseMarkdown(serialized);
		const serialized2 = serializeMarkdown(ast2);

		// Remove ID comments for comparison
		const cleanOriginal = serializeMarkdown(parseMarkdown(original), {
			skipmdast_id_comments: true,
		});
		const cleanResult = serializeMarkdown(ast2, {
			skipmdast_id_comments: true,
		});

		expect(cleanResult.trim()).toBe(cleanOriginal.trim());
	});
});
```

### Edge Case Tests

#### Test 9: Frontmatter Handling

```javascript
test("handles frontmatter correctly", () => {
	const markdown = `---
title: Test Document
author: John Doe
---

# Content

Regular paragraph.
`;

	const ast = parseMarkdown(markdown);
	expect(ast.children[0].type).toBe("yaml"); // or "toml"
	expect(ast.children[1].type).toBe("heading");
});
```

#### Test 10: GitHub Flavored Markdown Features

```javascript
test("handles GFM features", () => {
	const markdown = `
| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

~~Strikethrough text~~

- [x] Completed task
- [ ] Incomplete task
`;

	const ast = parseMarkdown(markdown);
	const tableNode = ast.children.find((n) => n.type === "table");
	const strikeNode = ast.children.find((n) =>
		n.children?.some((c) => c.type === "delete"),
	);

	expect(tableNode).toBeTruthy();
	expect(strikeNode).toBeTruthy();
});
```

## API Reference

### Core Functions

#### `parseMarkdown(markdown: string): MdAst`

Parses markdown string into MD-AST with mdast_id properties.

#### `serializeMarkdown(ast: MdAst, options?: SerializeOptions): string`

Serializes MD-AST back to markdown string.

#### `detectChanges(params: DetectChangesParams): DetectedChange[]`

Detects changes between two markdown contents.

#### `applyChanges(params: ApplyChangesParams): ApplyResult`

Applies changes to reconstruct markdown content.

### Utility Functions

#### `generateNodeId(node: MdAstNode): string`

Generates unique ID for AST node.

#### `parseHtmlIdComment(html: string): string | null`

Extracts ID from HTML comment.

#### `isHtmlIdComment(node: MdAstNode): boolean`

Checks if node is an HTML ID comment.

### Type Definitions

```typescript
interface MdAst {
	type: "root";
	children: MdAstNode[];
}

interface MdAstNode {
	type: string;
	mdast_id: string;
	children?: MdAstNode[];
	value?: string;
	[key: string]: any;
}

interface SerializeOptions {
	skipmdast_id_comments?: boolean;
}

interface DetectChangesParams {
	before: string | Uint8Array;
	after: string | Uint8Array;
}

interface ApplyChangesParams {
	changes: DetectedChange[];
	fileId: string;
	lix: LixInstance;
}
```

## Implementation Notes

1. **Performance**: Use Maps for O(1) node lookup during change detection
2. **Memory**: Clean up temporary data structures after processing
3. **Error Handling**: Gracefully handle malformed markdown and missing IDs
4. **Extensibility**: Support custom node types via plugin configuration
5. **Compatibility**: Ensure compatibility with existing remark plugins

## Future Enhancements

1. **Incremental Processing**: Only process changed sections for large documents
2. **Conflict Resolution**: Handle concurrent edits with merge strategies
3. **Schema Evolution**: Support schema versioning and migration
4. **Custom ID Generators**: Allow pluggable ID generation strategies
5. **Metadata Preservation**: Maintain additional node metadata during transformations
