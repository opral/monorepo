import { unified } from "unified"
import remarkStringify from "remark-stringify"
import remarkGfm from "remark-gfm"
import remarkFrontmatter from "remark-frontmatter"
import type { Ast } from "./schemas.js"

/**
 * Serialize an mdast-shaped AST (Root) back to a Markdown string.
 * - GFM is enabled by default for table/task-list/strikethrough serialization.
 */
export function serializeAst(ast: Ast): string {
	const processor = unified()
		.use(remarkStringify as any, {
			bullet: "-",
			listItemIndent: "one",
			rule: "-",
			ruleRepetition: 3,
			ruleSpaces: false,
			emphasis: "_",
			strong: "*",
		})
		.use(remarkGfm as any)
		.use(remarkFrontmatter as any, ["yaml"])

	// unified.stringify expects a compatible mdast Root
	const result = processor.stringify(ast as any) as string
	// Do not append a final trailing newline; normalize by dropping a single EOL
	return result.replace(/\n$/, "")
}

export type { Ast }
