import type { OnBeforeRender } from "@src/renderer/types.js"
import type { PageProps } from "./index.page.jsx"
import {
	FrontmatterSchema,
	tableOfContentsPromise,
} from "../../../../../documentation/tableOfContents.js"
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
/**
 * the table of contents without the html for each document
 * saving bandwith and speeding up the site)
 */

// should only run server side
export const onBeforeRender: OnBeforeRender<PageProps> = async (pageContext) => {
	// dirty way to get reload of markdown (not hot reload though)
	if (import.meta.env.DEV) {
		await generateIndexAndTableOfContents()
	}
	if (!Object.keys(index).includes(pageContext.urlPathname)) {
		throw RenderErrorPage({ pageContext: { is404: true } })
	}
	return {
		pageContext: {
			pageProps: {
				markdown: index[pageContext.urlPathname]!,
				processedTableOfContents: processedTableOfContents,
			},
		},
	}
}

/**
 * Generates the index and table of contents using async/await.
 */
async function generateIndexAndTableOfContents() {
	try {
		const tableOfContents = await tableOfContentsPromise

		const processedTableOfContents: { [key: string]: { frontmatter: any }[] } = {}
		const index: { [key: string]: any } = {}

		for (const { category, content } of tableOfContents) {
			const markdown = parseMarkdown({
				text: content,
				FrontmatterSchema,
			})
			if (!processedTableOfContents[category]) {
				processedTableOfContents[category] = []
			}
			processedTableOfContents[category].push({ frontmatter: markdown.frontmatter })
			index[markdown.frontmatter.href] = markdown
		}

		return { processedTableOfContents, index }
	} catch (error) {
		console.error("Error generating index and table of contents:", error)
		throw error
	}
}

// Call the function to generate the index and table of contents.
const { processedTableOfContents, index } = await generateIndexAndTableOfContents()
