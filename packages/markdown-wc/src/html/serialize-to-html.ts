import { unified, type Plugin } from "unified"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"
import { visit } from "unist-util-visit"

export type SerializeToHtmlOptions = {
	/**
	 * When true, embed diff-related hints to optimize downstream HTML diff rendering.
	 *
	 * Can be used with https://html-diff.lix.dev/
	 *
	 * @default false.
	 */
	diffHints?: boolean
}

// Public API: serialize Ast (mdast-shaped) to HTML string
export async function serializeToHtml(
	ast: any,
	options: SerializeToHtmlOptions = {}
): Promise<string> {
	// Single-pass remark plugin to serialize mdast data.* to HTML data-* and loosen lists
	// - Make lists "loose" so list items render paragraphs inside <li>
	// - Promote node.data.* to hProperties data-* attributes
	const remarkSerializeDataAttributes: Plugin<[], any> = () => (tree: any) => {
		visit(tree, (node: any) => {
			if (!node || typeof node !== "object") return
			// loose lists
			if (node.type === "list" || node.type === "listItem") (node as any).spread = true
			// diff hints: set data-diff-mode="words" for text-centric blocks (non-destructive: don't override if present)
			if (options.diffHints && (node.type === "paragraph" || node.type === "heading")) {
				const d = ((node as any).data ||= {}) as Record<string, any>
				if (d["diff-mode"] == null) d["diff-mode"] = "words"
			}
			// data -> data-*
			const d = (node as any).data
			if (d && typeof d === "object") {
				const h = (((node as any).data as any).hProperties ||= {}) as Record<string, any>
				for (const [k, v] of Object.entries(d)) {
					if (k === "hProperties") continue
					if (v == null) continue
					const t = typeof v
					if (t === "string" || t === "number" || t === "boolean") {
						h[`data-${k}`] = String(v)
					}
				}
			}
		})
	}
	// mdast -> hast
	const hast = await unified()
		.use(remarkSerializeDataAttributes as any)
		.use(remarkRehype as any, { allowDangerousHtml: true })
		.run(ast)
	// hast -> html
	const html = unified()
		.use(rehypeStringify, { allowDangerousHtml: true })
		.stringify(hast as any)
	// Normalize newlines to compact form matching TipTap's getHTML()
	return String(html).replace(/\n/g, "")
}
