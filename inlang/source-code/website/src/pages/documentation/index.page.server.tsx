import fs from "node:fs/promises"
import tableOfContents from "../../../../../documentation/tableOfContents.json"
import { convert } from "@inlang/markdown"
import { render } from "vite-plugin-ssr/abort"

const renderedMarkdown = {} as Record<string, string>
const repositoryRoot = new URL("../../../../../", import.meta.url)

export async function onBeforeRender(pageContext: any) {
	const slug =
		pageContext.urlPathname === "/documentation"
			? ""
			: pageContext.urlPathname.replace("/documentation/", "")

	if (renderedMarkdown[slug] === undefined) {
	for (const categories of Object.entries(tableOfContents)) {
		const [, pages] = categories
		for (const page of pages) {
			const text = await fs.readFile(new URL(`documentation/${page.path}`, repositoryRoot), "utf-8")
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
