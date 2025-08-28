import { unified } from "unified"
import remarkRehype from "remark-rehype"
import rehypeStringify from "rehype-stringify"

// Public API: serialize Ast (mdast-shaped) to HTML string
export async function serializeToHtml(ast: any): Promise<string> {
	// mdast -> hast
	const hast = await unified()
		.use(remarkRehype as any, { allowDangerousHtml: true })
		.run(ast)
	// hast -> html
	const html = unified()
		.use(rehypeStringify, { allowDangerousHtml: true })
		.stringify(hast as any)
	return String(html)
}
