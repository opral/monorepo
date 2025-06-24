import { describe, test, expect } from "vitest";
import { parseMarkdown } from "./parseMarkdown.js";
import { serializeMarkdown } from "./serializeMarkdown.js";

describe("markdown to ast transformation", () => {
	test("preserves existing IDs", () => {
		const markdown = `<!-- mdast_id = heading-1 -->
# Hello World

<!-- mdast_id = para-1 -->
This is a paragraph.`;

		const ast = parseMarkdown(markdown);
		expect(ast.children[0]?.mdast_id).toBe("heading-1");
		expect(ast.children[1]?.mdast_id).toBe("para-1");
	});

	test("generates IDs for nodes without comments", () => {
		const markdown = `# Hello World
This is a paragraph.`;

		const ast = parseMarkdown(markdown);
		expect(ast.children[0]?.mdast_id).toBeTruthy();
		expect(ast.children[1]?.mdast_id).toBeTruthy();
		expect(ast.children[0]?.mdast_id).not.toBe(ast.children[1]?.mdast_id);
	});

	test("handles frontmatter correctly", () => {
		const markdown = `---
title: Test Document
author: John Doe
---

# Content

Regular paragraph.`;

		const ast = parseMarkdown(markdown);
		// With remark-frontmatter, the frontmatter should be parsed as yaml
		expect(ast.children[0]?.type).toBe("yaml");
		expect(ast.children[1]?.type).toBe("heading");
		expect(ast.children[2]?.type).toBe("paragraph");

		// Check that frontmatter content is preserved
		expect((ast.children[0] as any)?.value).toContain("title: Test Document");
		expect((ast.children[0] as any)?.value).toContain("author: John Doe");
	});

	test("handles GFM features", () => {
		const markdown = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |

~~Strikethrough text~~

- [x] Completed task
- [ ] Incomplete task`;

		const ast = parseMarkdown(markdown);

		// With remark-gfm, tables should be parsed as table nodes
		const tableNode = ast.children.find((n) => n.type === "table");
		expect(tableNode).toBeTruthy();

		// Check for strikethrough in paragraph
		const paragraphWithDelete = ast.children.find(
			(n) =>
				n.type === "paragraph" &&
				(n as any).children?.some((child: any) => child.type === "delete"),
		);
		expect(paragraphWithDelete).toBeTruthy();

		// Check for task list
		const listNode = ast.children.find((n) => n.type === "list");
		expect(listNode).toBeTruthy();

		// Verify all nodes have IDs
		expect(ast.children.every((node) => node.mdast_id)).toBe(true);
	});
});

describe("ast to markdown transformation", () => {
	test("adds ID comments by default", () => {
		const ast = {
			type: "root" as const,
			children: [
				{
					type: "heading" as const,
					depth: 1,
					children: [
						{ type: "text" as const, value: "Hello", mdast_id: "text-1" },
					],
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
			type: "root" as const,
			children: [
				{
					type: "heading" as const,
					depth: 1,
					children: [
						{ type: "text" as const, value: "Hello", mdast_id: "text-1" },
					],
					mdast_id: "heading-1",
				},
			],
		};

		const markdown = serializeMarkdown(ast, { skip_id_comments: true });
		expect(markdown).not.toContain("<!-- mdast_id = heading-1 -->");
		expect(markdown).toContain("# Hello");
	});
});

describe("integration tests", () => {
	test("round-trip preserves content", () => {
		const original = `# Title

This is a **bold** paragraph with [a link](https://example.com).

\`\`\`javascript
console.log("Hello");
\`\`\`

- Item 1
- Item 2`;

		// Parse and serialize
		const ast = parseMarkdown(original);
		const serialized = serializeMarkdown(ast);

		// Parse again to verify consistency
		const ast2 = parseMarkdown(serialized);

		// Remove ID comments for comparison
		const cleanOriginal = serializeMarkdown(parseMarkdown(original), {
			skip_id_comments: true,
		});
		const cleanResult = serializeMarkdown(ast2, { skip_id_comments: true });

		expect(cleanResult.trim()).toBe(cleanOriginal.trim());
	});
});
