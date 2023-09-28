import fs from "node:fs/promises"
import tableOfContents from "../../../../../../blog/tableOfContents.json"
import { convert } from "@inlang/markdown"
import { render } from "vite-plugin-ssr/abort"

const renderedMarkdown = {} as Record<string, string>
const repositoryRoot = new URL("../../../../../../", import.meta.url)

export async function onBeforeRender(pageContext: any) {
	const { id } = pageContext.routeParams

	if (renderedMarkdown[id] === undefined) {
		for (const content of tableOfContents) {
			const text = await fs.readFile(
				new URL(`inlang/blog/${content.path}`, repositoryRoot),
				"utf-8"
			)
			const markdown = await convert(text)
			renderedMarkdown[content.slug] = markdown
		}
	}

	if (renderedMarkdown[id] === undefined) {
		throw render(404)
	}

	return {
		pageContext: {
			pageProps: {
				markdown: renderedMarkdown[id],
			},
		},
	}
}
