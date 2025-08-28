import { unified } from "unified"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"

// Public API: serialize Ast (mdast-shaped) to HTML string
export async function serializeToHtml(ast: any): Promise<string> {
	// Make lists "loose" so list items render paragraphs inside <li> to match editor HTML
	function loosen(node: any) {
		if (!node || typeof node !== "object") return
		if (node.type === "list") (node as any).spread = true
		if (node.type === "listItem") (node as any).spread = true
		if (Array.isArray((node as any).children)) (node as any).children.forEach(loosen)
	}
	loosen(ast)
	// mdast -> hast
	const hast = await unified()
		.use(remarkRehype as any, { allowDangerousHtml: true })
		.run(ast)
	// hast -> html
	const html = unified()
		.use(rehypeStringify, { allowDangerousHtml: true })
		.stringify(hast as any)
	// Normalize newlines to compact form matching TipTap's getHTML()
	return String(html).replace(/\n/g, "")
}
