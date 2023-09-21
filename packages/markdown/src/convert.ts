import { unified } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
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
		.use(remarkGfm)
		/* @ts-ignore */
		.use(remarkRehype, { allowDangerousHtml: true })
		/* @ts-ignore */
		.use(rehypeRaw)
		/* @ts-ignore */
		.use(rehypeSanitize, {
			tagNames: ["doc-figure", "doc-link", "doc-links", "doc-icon", ...defaultSchema.tagNames!],
			attributes: {
				"doc-figure": ["src", "alt", "caption"],
				"doc-link": ["href", "description", "title", "icon"],
				...defaultSchema.attributes,
			},
		})
		.use(rehypeHighlight)
		.use(rehypeSlug)
		/* @ts-ignore */
		.use(addClasses, {
			"h1,h2,h3,h4,h5,h6": "doc-font-semibold doc-leading-relaxed doc-my-6 doc-cursor-pointer",
			h1: "doc-text-3xl doc-pb-3 doc-mb-2",
			h2: "doc-text-2xl doc-pb-3 doc-mb-1",
			h3: "doc-text-xl",
			h4: "doc-text-lg",
			h5: "doc-text-lg",
			h6: "doc-text-base",
			p: "doc-text-base text-surface-600 doc-my-4 doc-leading-relaxed",
			a: "text-primary doc-font-medium hover:text-hover-primary",
			code: "doc-px-1 doc-py-0.5 doc-bg-surface-100 doc-rounded-lg bg-surface-200 doc-my-6 doc-text-sm doc-font-mono text-surface-900",
			ul: "doc-list-disc doc-list-inside",
			ol: "doc-list-decimal doc-list-inside",
			li: "doc-my-3",
			table: "doc-table-auto doc-w-full doc-my-6 doc-rounded-xl doc-text-left",
			thead: "doc-font-medium pb-2 doc-border-b border-surface-4 doc-text-left",
			th: "doc-py-2 doc-font-medium doc-border-b border-surface-2",
			tr: "doc-py-2 doc-border-b border-surface-2",
			td: "doc-py-2 doc-leading-7",
			hr: "doc-my-6 doc-border-b doc-border-surface-200",
			img: "doc-mx-auto doc-my-4 doc-rounded-2xl doc-border border-surface-2",
		})
		.use(rehypeAutolinkHeadings)
		.use(rehypeAccessibleEmojis)
		/* @ts-ignore */
		.use(rehypeMermaid)
		/* @ts-ignore */
		.use(rehypeStringify)
		.process(preSanitize(markdown))

	return String(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark-dimmed.min.css">
	${content}`)
}

/* Some emojis can't be rendered in the font the website provides, therefore presanitization is needed */
function preSanitize(markdown: string): string {
	markdown = markdown.replaceAll("1️⃣", "1").replaceAll("2️⃣", "2").replaceAll("3️⃣", "3")
	return markdown
}
