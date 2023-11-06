import fs from "node:fs/promises"
import tableOfContents from "../../../../../documentation/tableOfContents.json"
import { convert } from "@inlang/markdown"
import { render } from "vike/abort"

const renderedMarkdown = {} as Record<string, string>

/* Slices the relative path to the repository, no matter where in the file system the code is executed from.
This is necessary because the code is executed from the build folder. */
const repositoryRoot = import.meta.url.slice(0, import.meta.url.lastIndexOf("inlang/source-code"))

export async function onBeforeRender(pageContext: any) {
	const slug =
		pageContext.urlPathname === "/documentation"
			? ""
			: pageContext.urlPathname.replace("/documentation/", "")

	if (renderedMarkdown[slug] === undefined) {
		for (const categories of Object.entries(tableOfContents)) {
			const [, pages] = categories
			for (const page of pages) {
				const text = await fs.readFile(
					new URL(`inlang/documentation/${page.path}`, repositoryRoot),
					"utf-8"
				)
				const markdown = await convert(text)
				renderedMarkdown[page.slug] = markdown
			}
		}
	}

	if (renderedMarkdown[slug] === undefined) {
		throw render(404)
	}

	return {
		pageContext: {
			pageProps: {
				markdown: renderedMarkdown[slug],
			},
		},
	}
}
