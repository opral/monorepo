import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import rehypeSanitize from "rehype-sanitize"
import rehypeSlug from "rehype-slug"
import rehypeHighlight from "rehype-highlight"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import addClasses from "rehype-class-names"
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis"
import defaultTags from "./default-tags.json"

/* Converts the markdown with remark and the html with rehype to be suitable for being rendered */
export async function convert(markdown: string): Promise<string> {
	const content = await unified()
		/* @ts-ignore */
		.use(remarkParse)
		/* @ts-ignore */
		.use(remarkRehype, { allowDangerousHtml: true })
		/* @ts-ignore */
		.use(rehypeRaw)
		/* @ts-ignore */
		.use(rehypeSanitize, {
			tagNames: ["doc-figure", ...defaultTags],
		})
		.use(rehypeHighlight)
		.use(rehypeSlug)
		/* @ts-ignore */
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
			ul: "list-disc list-inside",
			ol: "list-decimal list-inside",
			li: "my-2",
			table: "table-auto w-full my-6",
			th: "p-2 rounded text-sm text-surface-700 font-medium",
			td: "p-2 leading-7",
			hr: "my-4 border-b border-surface-200",
		})
		.use(rehypeAutolinkHeadings)
		.use(rehypeAccessibleEmojis)
		/* @ts-ignore */
		.use(rehypeStringify)
		.process(markdown)

	return String(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css">
	${content}`)
}
