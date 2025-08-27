import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkFrontmatter from "remark-frontmatter"
import type { Root as Ast } from "mdast"

/**
 * Parse a Markdown string into an mdast-shaped AST (Root).
 * - GFM and frontmatter are enabled by default.
 * - No sanitize, no ID insertion, no transformations.
 */
export function parseMarkdown(markdown: string): Ast {
	const processor = unified()
		.use(remarkParse as any)
		.use(remarkGfm as any)
		.use(remarkFrontmatter as any, ["yaml"])

	// unified.parse returns a unist tree; cast to mdast Root for consumers
	const tree = processor.parse(markdown) as unknown as Ast
	return tree
}
