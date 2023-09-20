import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import rehypeSlug from "rehype-slug"
import rehypeHighlight from "rehype-highlight"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import rehypeMermaid from "rehype-mermaidjs"
import addClasses from "rehype-class-names"
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis"

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
			tagNames: [
				"display-figure",
				"quick-link",
				"quick-links",
				"web-icon",
				...defaultSchema.tagNames!,
			],
			attributes: {
				"display-figure": ["src", "alt", "caption"],
				"quick-link": ["href", "description", "title", "icon"],
				...defaultSchema.attributes,
			},
		})
		.use(rehypeHighlight)
		.use(rehypeSlug)
		/* @ts-ignore */
		.use(addClasses, {
			"h1,h2,h3,h4,h5,h6": "im-font-semibold im-leading-relaxed im-my-5 im-cursor-pointer",
			h1: "im-text-3xl",
			h2: "im-text-2xl",
			h3: "im-text-xl",
			h4: "im-text-lg",
			h5: "im-text-lg",
			h6: "im-text-base",
			p: "im-text-base im-text-surface-600 im-my-1 im-leading-relaxed",
			a: "text-primary im-font-medium hover:text-hover-primary",
			code: "im-p-1 im-bg-surface-100 im-rounded-xl im-my-4 im-text-sm im-font-mono im-text-surface-700",
			ul: "im-list-disc im-list-inside",
			ol: "im-list-decimal im-list-inside",
			li: "im-my-2",
			table: "im-table-auto im-w-full im-my-6",
			th: "im-p-2 im-rounded-xl im-text-sm im-text-surface-700 im-font-medium",
			td: "im-p-2 im-leading-7",
			hr: "im-my-4 im-border-b im-border-surface-200",
			img: "im-mx-auto im-my-4 im-rounded-2xl border border-surface-2",
		})
		.use(rehypeAutolinkHeadings)
		.use(rehypeAccessibleEmojis)
		/* @ts-ignore */
		.use(rehypeMermaid)
		/* @ts-ignore */
		.use(rehypeStringify)
		.process(markdown)

	return String(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark-dimmed.min.css">
	${content}`)
}
