import type { OnBeforeRender } from "#src/renderer/types.js"
import type { PageProps } from "./index.page.jsx"
import { marketplaceItems } from "@inlang/marketplace"
import { RequiredFrontmatter } from "#src/services/markdown/index.js"
import { parseMarkdown } from "#src/services/markdown/index.js"

const FrontmatterSchema = RequiredFrontmatter

const fetchReadmeContents = async () => {
	const readmeContents = []

	const rawLink = (githubLink: string) => {
		const parts = githubLink.split("/")
		const username = parts[3]
		const repository = parts[4]
		const branch = parts[6]
		const filePath = parts.slice(7).join("/")

		console.log(`https://raw.githubusercontent.com/${username}/${repository}/${branch}/${filePath}`)

		return `https://raw.githubusercontent.com/${username}/${repository}/${branch}/${filePath}`
	}

	for (const item of marketplaceItems) {
		const rawReadmeLink = rawLink(item.meta.marketplace.linkToReadme.en)
		const response = await fetch(rawReadmeLink)
		const readmeText = await response.text()
		readmeContents.push(readmeText)
	}

	// console.log(readmeContents)

	return readmeContents
}

/**
 * the table of contents without the html for each document
 * saving bandwidth and speeding up the site
 */
export type ProcessedTableOfContents = Record<
	string,
	Awaited<ReturnType<typeof parseMarkdown>>["frontmatter"]
>

/**
 * The index of documentation markdown files. The href's act as an id.
 *
 * @example
 * {
 *   "/documentation/intro": document,
 * }
 */
const index: Record<string, Awaited<ReturnType<typeof parseMarkdown>>> = {}

/**
 * the table of contents without the html for each document
 * saving bandwidth and speeding up the site)
 */
const processedTableOfContents: ProcessedTableOfContents = {}

;(async () => {
	const contents = await fetchReadmeContents()

	for (const document of contents) {
		const markdown = parseMarkdown({
			text: document,
			FrontmatterSchema,
		})

		processedTableOfContents[markdown.frontmatter.href] = markdown.frontmatter
		index[markdown.frontmatter.href] = markdown
	}
})()

// should only run server side
export const onBeforeRender: OnBeforeRender<PageProps> = async (pageContext) => {
	// dirty way to get reload of markdown (not hot reload though)
	if (import.meta.env.DEV) {
		await generateIndexAndTableOfContents()
	}
	return {
		pageContext: {
			pageProps: {
				markdown: index[pageContext.urlPathname],
				processedTableOfContents: processedTableOfContents,
			},
		},
	}
}

/**
 * Generates the index and table of contents.
 */
async function generateIndexAndTableOfContents() {
	const contents = await fetchReadmeContents()

	for (const document of contents) {
		const markdown = parseMarkdown({
			text: document,
			FrontmatterSchema,
		})

		processedTableOfContents[markdown.frontmatter.href] = markdown.frontmatter
		index[markdown.frontmatter.href] = markdown
	}
}
