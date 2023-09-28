import fs from "node:fs/promises"
import tableOfContents from "../../../../../../blog/tableOfContents.json"
import { convert } from "@inlang/markdown"
import { render } from "vite-plugin-ssr/abort"

const renderedMarkdown = {} as Record<string, string>

export async function onBeforeRender(pageContext: any) {
	const { id } = pageContext.routeParams

	if (renderedMarkdown[id] === undefined) {
		for (const content of tableOfContents) {
			let text

			try {
				text = await fs.readFile(
					new URL(`../../../../../../blog/${content.path}`, import.meta.url),
					"utf-8"
				)
			} catch (error) {
				console.error(error)
				throw render(404)
			}

			const markdown = await convert(text)
			renderedMarkdown[content.slug] = markdown
		}
	}

	return {
		pageContext: {
			pageProps: {
				markdown: renderedMarkdown[id],
			},
		},
	}
}
