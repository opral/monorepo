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
import remarkFrontmatter from "remark-frontmatter"

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
	frontmatter: Record<string, any> & { custom_elements: Record<string, string> }
	html: string
}> {
	const withDefaults = {
		inlineStyles: defaultInlineStyles,
		...options,
	}

	const content = await unified()
		/* @ts-ignore */
		.use(remarkParse)
		/* @ts-ignore */
		.use(remarkGfm)
		.use(remarkFrontmatter, ["yaml"])
		.use(() => (tree, file) => {
			// Extract frontmatter and store it in `file.data`
			// @ts-ignore
			const yamlNode = tree.children.find((node: any) => node.type === "yaml")
			if (yamlNode && yamlNode.value) {
				try {
					file.data.frontmatter = yaml.parse(yamlNode.value)
				} catch (e) {
					// @ts-ignore
					throw new Error(`Failed to parse frontmatter: ${e.message}`)
				}
				// @ts-ignore
				// Remove the YAML node from the tree
				tree.children = tree.children.filter((node: any) => node.type !== "yaml")
			} else {
				file.data.frontmatter = {}
			}
		})
		/* @ts-ignore */
		.use(remarkRehype, { allowDangerousHtml: true })
		/* @ts-ignore */
		.use(rehypeRaw)
		/* @ts-ignore */
		.use(() => (tree, file) => {
			// Dynamically configure `rehypeSanitize` based on frontmatter in `file.data`
			// @ts-ignore
			return rehypeSanitize(createSanitizeOptions(file.data.frontmatter || {}))(tree, file)
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
		frontmatter: {
			custom_elements: {},
			...(content.data.frontmatter as Record<string, any>),
		},
		html: String(`<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark-dimmed.min.css">
	${content}`),
	}
}

function createSanitizeOptions(frontmatter: Record<string, any>) {
	return {
		...defaultSchema,
		tagNames: [
			// Allow custom elements
			...Object.keys(frontmatter.custom_elements ?? []),
			...(defaultSchema.tagNames ?? []),
		],
		attributes: {
			// Allow any attributes on custom elements
			...Object.keys(frontmatter.custom_elements ?? {}).reduce(
				(acc, customElement) => ({
					...acc,
					[customElement]: ["*"],
				}),
				{}
			),
			...(defaultSchema.attributes ?? {}),
		},
	}
}
