import { unified } from "unified"
import rehypeParse from "rehype-parse"
import rehypeRemark from "rehype-remark"
import remarkGfm from "remark-gfm"
import remarkStringify from "remark-stringify"
import remarkParse from "remark-parse"

// Public API: parse HTML string back to Ast (mdast-shaped)
export async function parseFromHtml(html: string): Promise<any> {
	// html -> hast -> mdast text
	const mdFile = await unified()
		.use(rehypeParse, { fragment: true })
		.use(rehypeRemark)
		.use(remarkGfm as any)
		.use(remarkStringify)
		.process(html)

	// markdown text -> mdast
	const ast = unified()
		.use(remarkParse as any)
		.use(remarkGfm as any)
		.parse(String(mdFile))
	return ast
}
