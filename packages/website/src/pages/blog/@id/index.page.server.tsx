import fs from "node:fs/promises"
import tableOfContents from "../../../../../../blog/tableOfContents.json"
import { convert } from "@inlang/markdown"
import { render } from "vite-plugin-ssr/abort"

const renderedMarkdown = {} as Record<string, string>
const repositoryRoot = new URL("../../../../../../", import.meta.url)

export async function onBeforeRender(pageContext: any) {
	const slug = pageContext.urlPathname.slice(`/blog/`.length)
	if (renderedMarkdown[slug] === undefined) {
		const content = tableOfContents.find((content) => content.slug === slug)

		if (!content) {
			throw render(404)
		}

		const text = await fs.readFile(new URL(`blog/${content.path}`, repositoryRoot), "utf-8")
		const markdown = await convert(text)
		renderedMarkdown[slug] = markdown
	}
	return {
		pageContext: {
			pageProps: {
				markdown: renderedMarkdown[slug],
			},
		},
	}
}
