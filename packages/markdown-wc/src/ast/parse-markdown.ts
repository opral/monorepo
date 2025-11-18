import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkFrontmatter from "remark-frontmatter"
import type { Ast } from "./schemas.js"
import { normalizeAst } from "./normalize-ast.js"

/**
 * Parse a Markdown string into an mdast-shaped AST (Root).
 * - GFM and frontmatter are enabled by default.
 * - No sanitize, no ID insertion, no transformations.
 */
export function parseMarkdown(markdown: string): Ast {
	// Forbid self-closing HTML tags in Markdown input for AST workflows.
	// This keeps block handling deterministic for plugins that persist
	// top-level HTML nodes. Ask authors to use explicit open/close tags.
	// Note: we skip code fences to avoid false positives.
	const scrubbed = markdown.replace(/```[\s\S]*?```/g, "")
	const m = scrubbed.match(/<([A-Za-z][\w-]*)(?:\s[^<>]*?)?\/>/)
	if (m) {
		const tag = m[1]
		throw new Error(
			`markdown-wc: self-closing HTML tags are not supported in AST mode: <${tag} />. ` +
				"Use <" +
				tag +
				"></" +
				tag +
				"> instead."
		)
	}
	const processor = unified()
		.use(remarkParse as any)
		.use(remarkGfm as any)
		.use(remarkFrontmatter as any, ["yaml"])

	// unified.parse returns a unist tree; cast to mdast Root for consumers
	const tree = processor.parse(markdown) as unknown as Ast
	return normalizeAst(tree)
}
