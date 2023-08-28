import type { OnBeforeRender } from "#src/renderer/types.js"
import type { PageProps } from "./index.page.jsx"
import { parseMarkdown } from "#src/services/markdown/index.js"
import { RenderErrorPage } from "vite-plugin-ssr/RenderErrorPage"
import fs from "node:fs/promises"
import { BlogFrontmatterSchema } from "./frontmatterSchema.js"
import tableOfContents from "../../../../../../content/blog/tableOfContents.json"

/**
 * The root of the repository.
 *
 * Makes it possible to use absolute paths for rendering markdown.
 */
const repositoryRoot = new URL("../../../../../../", import.meta.url)

/**
 * the table of contents without the html for each document
 * saving bandwith and speeding up the site)
 */
export type ProcessedTableOfContents = Record<
	string,
	Awaited<ReturnType<typeof parseMarkdown>>["frontmatter"]
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
 * Generates the index and table of contents.
 */
async function generateIndexAndTableOfContents() {
	for (const path of tableOfContents) {
		const text = await fs.readFile(new URL(`content/blog/${path}`, repositoryRoot), "utf-8")
		const markdown = parseMarkdown({
			text,
			frontmatterSchema: BlogFrontmatterSchema,
		})
		// not pushing to processedTableOfContents directly in case
		// the category is undefined so far
		processedTableOfContents[markdown.frontmatter.href] = markdown.frontmatter

		index[markdown.frontmatter.href] = markdown
	}
}
