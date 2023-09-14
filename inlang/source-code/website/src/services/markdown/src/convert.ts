import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import remarkGfm from "remark-gfm"
import remarkDirective from "remark-directive"
import rehypeStringify from "rehype-stringify"
import rehypeSlug from "rehype-slug"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import addClasses from "rehype-add-classes"
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis"
import { visit } from "unist-util-visit"

export async function convert(markdown: string): Promise<string> {
	const content = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(remarkDirective)
		// .use(inlangRemarkDirectives)
		.use(rehypeSlug)
		.use(addClasses, {
			"h1,h2,h3,h4,h5,h6": "font-semibold leading-relaxed my-5 cursor-pointer",
			h1: "text-3xl",
			h2: "text-2xl",
			h3: "text-xl",
			h4: "text-lg",
			h5: "text-lg",
			h6: "text-base",
			p: "text-base text-surface-600 my-1 leading-relaxed",
			a: "text-primary font-medium hover:text-hover-primary",
			code: "p-1 bg-surface-100 rounded text-sm font-mono text-surface-700",
			pre: "p-4 bg-surface-100 rounded text-sm font-mono text-surface-700 my-4",
			ul: "list-disc list-inside",
			ol: "list-decimal list-inside",
			table: "table-auto w-full my-6",
			th: "bg-surface-100 p-2 rounded text-smtext-surface-700",
			td: "p-2 leading-7",
			hr: "my-4 border-b border-surface-200",
		})
		.use(rehypeAutolinkHeadings)
		.use(rehypeAccessibleEmojis)
		.use(rehypeStringify)
		.process(markdown)

	return String(content)
}

/** @type {import('unified').Plugin<[], import('mdast').Root>} */
// function inlangRemarkDirectives() {
// 	return (tree, file) => {
// 		visit(tree, (node) => {
// 			if (
// 				node.type === "textDirective" ||
// 				node.type === "leafDirective" ||
// 				node.type === "containerDirective"
// 			) {
// 				if (node.name !== "test") return

// 				const data = node.data || (node.data = {})
// 				const attributes = node.attributes || {}
// 				const id = attributes.id

// 				if (node.type === "textDirective")
// 					file.fail("Text directives for `youtube` not supported", node)
// 				if (!id) file.fail("Missing video id", node)

// 				data.hName = "iframe"
// 				data.hProperties = {
// 					src: "https://www.youtube.com/embed/" + id,
// 					width: 200,
// 					style: "background: red;",
// 					height: 200,
// 					frameBorder: 0,
// 					allow: "picture-in-picture",
// 					allowFullScreen: true,
// 				}
// 			}
// 		})
// 	}
// }
