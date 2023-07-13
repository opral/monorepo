import type { OnBeforeRender } from "@src/renderer/types.js"
import type { PageProps } from "./index.page.jsx"
import { tableOfContents, FrontmatterSchema } from "../../../../../documentation/tableOfContents.js"
import { parseMarkdown } from "@src/services/markdown/index.js"
import { RenderErrorPage } from "vite-plugin-ssr/RenderErrorPage"

/**
 * the table of contents without the html for each document
 * saving bandwith and speeding up the site)
 */
export type ProcessedTableOfContents = Record<
	string,
	// documents (re-creating the tableOfContents type to omit html)
	Omit<(typeof index)[keyof typeof index], "html">[]
>

/**
 * The index of documentation markdown files. The href's acts as id.
 *
 * @example
 * 	{
 * 		"/documentation/intro": document,
 * 	}
 */
const index: Record<string, Awaited<ReturnType<typeof parseMarkdown>>> = {}
/**
 * the table of contents without the html for each document
 * saving bandwith and speeding up the site)
 */
const processedTableOfContents: ProcessedTableOfContents = {}

await generateIndexAndTableOfContents()

// should only run server side
export const onBeforeRender: OnBeforeRender<PageProps> = async (pageContext) => {
	let headings = []
	// dirty way to get reload of markdown (not hot reload though)
	if (import.meta.env.DEV) {
		await generateIndexAndTableOfContents()
		headings = await generateHeadings(pageContext.urlPathname)
	}
	if (!Object.keys(index).includes(pageContext.urlPathname)) {
		throw RenderErrorPage({ pageContext: { is404: true } })
	}
	return {
		pageContext: {
			pageProps: {
				markdown: index[pageContext.urlPathname],
				processedTableOfContents: processedTableOfContents,
				headings: headings,
			},
		},
	}
}

/**
 * Generates the index and table of contents.
 */
async function generateIndexAndTableOfContents() {
	for (const [category, documents] of Object.entries(tableOfContents)) {
		const frontmatters: { frontmatter: any }[] = []
		for (const document of documents) {
			const markdown = parseMarkdown({
				text: document,
				FrontmatterSchema,
			})
			// not pushing to processedTableOfContents directly in case
			// the category is undefined so far
			frontmatters.push({ frontmatter: markdown.frontmatter })
			index[markdown.frontmatter.href] = markdown
		}
		processedTableOfContents[category] = frontmatters
	}
}

/**
 * Generates the headings
 */
async function generateHeadings(urlPathname: string) {
	const headings: PageProps["headings"] = []

	const markdown = index[urlPathname]
	if (markdown && markdown.renderableTree) {
		for (const heading of markdown.renderableTree.children) {
			if (heading.name === "Heading") {
				if (heading.children[0].name) {
					headings.push(heading.children[0])
				} else {
					headings.push(heading)
				}
			}
		}
	}

	return headings
}
