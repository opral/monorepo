import fs from "node:fs"
import tableOfContents from "../../../../../../blog/tableOfContents.json"
import { convert } from "@inlang/markdown"
import { render } from "vite-plugin-ssr/abort"

const renderedMarkdown = {} as Record<string, string>
const repositoryRoot = new URL("../../../../../../", import.meta.url)

export async function onBeforeRender(pageContext: any) {
	const { id } = pageContext.routeParams

	const path = tableOfContents.find((page) => page.slug === id)?.path
	if (!path) throw render(404)

	const content = await convert(fs.readFileSync(new URL(`blog/${path}`, repositoryRoot), "utf-8"))
	renderedMarkdown[id] = content

	return {
		pageContext: {
			pageProps: {
				markdown: renderedMarkdown[id],
			},
		},
	}
}
