import { unified, type Plugin } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import rehypeSanitize, { defaultSchema } from "rehype-sanitize"
import rehypeSlug from "rehype-slug"
import rehypeHighlight from "rehype-highlight"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import { rehypeAccessibleEmojis } from "rehype-accessible-emojis"
import { preprocess } from "./preprocess.js"
import yaml from "yaml"
import { defaultInlineStyles, rehypeInlineStyles } from "./inline-styles.js"

/* Converts the markdown with remark and the html with rehype to be suitable for being rendered */
export async function parse(
	markdown: string,
	options?: {
		/**
		 * Inline styles to be applied to the HTML elements
		 *
		 * @example
		 *   const inlineStyles = {
		 *     h1: {
		 *      font-weight: "600",
		 *      line-height: "1.625",
		 *     }
		 *   }
		 */
		inlineStyles?: Record<string, Record<string, string>>
	}
): Promise<{
	frontmatter: Record<string, any> & { imports: Record<string, string>[] }
	html: string
}> {
	const withDefaults = {
		inlineStyles: defaultInlineStyles,
		...options,
	}

	// Extract frontmatter manually
	const frontmatterMatch = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n/m)
	let frontmatter: Record<string, any> & { imports: Record<string, string>[] } = { imports: [] }

	if (frontmatterMatch) {
		frontmatter = yaml.parse(frontmatterMatch[1]!) || { imports: [] }
		// Remove the frontmatter from the markdown string
		markdown = markdown.slice(frontmatterMatch[0].length).trimStart()
	}

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
			...defaultSchema,

			tagNames: [
				// allow the custom elements
				...Object.keys(frontmatter.imports ?? []),
				...(defaultSchema.tagNames ?? []),
			],
			attributes: {
				// allow any attributes on custom elements
				...Object.keys(frontmatter.imports ?? {}).map((customElement) => ({
					[customElement]: ["*"],
				})),
				...(defaultSchema.attributes ?? {}),
			},
		})
		.use(rehypeHighlight)
		.use(rehypeSlug)
		.use(rehypeInlineStyles(withDefaults.inlineStyles))
		/* @ts-ignore */
		.use(rehypeAutolinkHeadings, {
			behavior: "wrap",
			properties: {
				onclick: `event.preventDefault(); event.target.hash && document.getElementById(event.target.hash.substring(1)) && window.scrollTo({top: document.getElementById(event.target.hash.substring(1)).offsetTop - 200, behavior: "smooth"}); window.history.pushState(null, null, event.target.hash);`,
			},
		})
		/* @ts-ignore */
		.use(rehypeAccessibleEmojis)
		/* @ts-ignore */
		.use(rehypeStringify)
		.process(preprocess(markdown))

	return {
		frontmatter,
		html: String(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark-dimmed.min.css">
	${content}`),
	}
}
