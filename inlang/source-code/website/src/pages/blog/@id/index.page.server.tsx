import fs from "node:fs/promises"
import path from "node:path"
import tableOfContents from "../../../../../../blog/tableOfContents.json"
import { convert } from "@inlang/markdown"
import { render } from "vite-plugin-ssr/abort"

const renderedMarkdown = {} as Record<string, string>

export async function onBeforeRender(pageContext: any) {
	const { id } = pageContext.routeParams

	if (renderedMarkdown[id] === undefined) {
		const promises = tableOfContents.map(async (content) => {
			const filePath = path.normalize(
				new URL(`../../../../../../../inlang/blog/${content.path}`, import.meta.url).pathname
			)

			try {
				const text = await fs.readFile(filePath, "utf-8")

				const markdown = await convert(text)
				renderedMarkdown[content.slug] = markdown
			} catch (error) {
				console.error(error)
				throw render(404)
			}
		})

		await Promise.all(promises)
	}

	return {
		pageContext: {
			pageProps: {
				markdown: renderedMarkdown[id],
			},
		},
	}
}
