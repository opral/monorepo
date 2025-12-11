import { unified, type Plugin } from "unified"
import remarkParse from "remark-parse"
import remarkGfm from "remark-gfm"
import remarkRehype from "remark-rehype"
import rehypeRaw from "rehype-raw"
import rehypeStringify from "rehype-stringify"
import { defaultSchema } from "rehype-sanitize"
import rehypeSlug from "rehype-slug"
import rehypeHighlight from "rehype-highlight"
import rehypeAutolinkHeadings from "rehype-autolink-headings"
import { preprocess } from "./preprocess.js"
import yaml from "yaml"
import { defaultInlineStyles, rehypeInlineStyles } from "./inline-styles.js"
import remarkFrontmatter from "remark-frontmatter"
import { visit } from "unist-util-visit"
import { rehypeGithubAlerts } from "./html/rehype-github-alerts.js"
import { rehypeCodeBlocks } from "./html/rehype-codeblocks.js"
import {
	remarkExternalLinks,
	type ExternalLinksOptions,
} from "./remark-external-links.js"

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
		/**
		 * When enabled, external links open in a new tab and get a safe rel.
		 *
		 * `true` applies defaults to all absolute http(s) links (treated as external).
		 * You can pass an object to customize detection and attributes.
		 *
		 * @default false
		 *
		 * @example
		 * parse(markdown, { externalLinks: true })
		 */
		externalLinks?: boolean | ExternalLinksOptions
	}
): Promise<{
	frontmatter: Record<string, any> & { imports?: string[] }
	detectedCustomElements: string[]
	html: string
}> {
	const withDefaults = {
		inlineStyles: defaultInlineStyles,
		externalLinks: false,
		...options,
	}

	const processor = unified()
		// @ts-ignore
		.use(remarkParse)
		// @ts-ignore
		.use(remarkGfm)
		.use(remarkFrontmatter, ["yaml"])

	if (withDefaults.externalLinks) {
		if (typeof withDefaults.externalLinks === "object") {
			processor.use(remarkExternalLinks as any, withDefaults.externalLinks)
		} else {
			processor.use(remarkExternalLinks as any)
		}
	}

	const content = await processor.use(() => (tree, file) => {
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
				tree.children = tree.children.filter((node: any) => node.type !== "yaml")
			}
		})
		.use(mermaidTransformer)
		.use(customElementDetector)
		.use(codeBlockDetector)
		// @ts-ignore
		.use(remarkRehype, { allowDangerousHtml: true })
		.use(rehypeRaw)
		.use(rehypeGithubAlerts as any)
		// TODO sanitization
		// sanitization broke for attributes of custom elements
		// took too much time to fix now
		// .use(() => (tree, file) => {
		// 	// @ts-ignore
		// 	return rehypeSanitize(createSanitizeOptions(file.data.customElements || []))(tree, file)
		// })
		.use(rehypeHighlight)
		.use(rehypeSlug)
		.use(rehypeCodeBlocks as any)
		.use(rehypeInlineStyles(withDefaults.inlineStyles))
		.use(rehypeAutolinkHeadings, {
			behavior: "wrap",
		})
		.use(rehypeStringify)
		.process(preprocess(markdown))

	let html = String(content)

	let frontmatter = (content.data.frontmatter as Record<string, any> & { imports?: string[] }) ?? {}

	const hasMermaidDiagram = html.includes("<markdown-wc-mermaid>")

	if (hasMermaidDiagram) {
		// import markdown-wc-mermaid component
		frontmatter.imports = [
			...(frontmatter.imports ?? []),
			"https://cdn.jsdelivr.net/npm/@opral/markdown-wc/dist/markdown-wc-mermaid.js",
		]
	}

	if (content.data.containsCodeBlock) {
		html = `<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.8.0/styles/github-dark.min.css">
			${html}`
	}

	return {
		frontmatter,
		detectedCustomElements: (content.data.customElements as []) ?? [],
		html,
	}
}

function createSanitizeOptions(customElements: string[]) {
	return {
		...defaultSchema,
		tagNames: [...customElements, ...(defaultSchema.tagNames ?? [])],
		attributes: {
			...customElements.reduce(
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

const codeBlockDetector: Plugin = () => (tree, file) => {
	// Initialize the containsCodeBlock flag in file.data
	file.data.containsCodeBlock = false

	// Detect if there are code blocks in the Markdown tree
	// @ts-ignore
	for (const node of tree.children) {
		if (node.type === "code") {
			file.data.containsCodeBlock = true
			break
		}
	}
}

const customElementDetector: Plugin = () => (tree, file) => {
	const markdownText = String(file.value)
	const regex = /<\/([a-zA-Z0-9-]+)>/g
	const customElements = new Set<string>()
	let match

	while ((match = regex.exec(markdownText)) !== null) {
		customElements.add(match[1]!)
	}

	// Store detected custom elements in file.data
	file.data.customElements = Array.from(customElements)
}

function mermaidTransformer() {
	return (tree: any) => {
		visit(tree, "code", (node: any) => {
			if (node.lang === "mermaid") {
				node.type = "html"
				node.value = `<markdown-wc-mermaid>${node.value}</markdown-wc-mermaid>`
			}
		})
	}
}
