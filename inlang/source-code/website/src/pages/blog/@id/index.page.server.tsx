import { convert } from "@inlang/markdown"
import { RenderErrorPage } from "vite-plugin-ssr/RenderErrorPage"
import fs from "node:fs/promises"
import tableOfContents from "../../../../../../blog/tableOfContents.json"
import type { OnBeforeRender } from "#src/renderer/types.js"
import type { PageProps } from "./index.page.jsx"

const repositoryRoot = new URL("../../../../../", import.meta.url)

export type GeneratedTableOfContents = Record<
	string,
	{
		title: string
		description: string
		href: string
	}[]
>

const index: Record<string, Awaited<ReturnType<any>>> = {}
const generatedTableOfContents = {} as GeneratedTableOfContents

await generateIndexAndTableOfContents()

export const onBeforeRender: OnBeforeRender<PageProps> = async (pageContext) => {
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
				processedTableOfContents: generatedTableOfContents,
			},
		},
	}
}

async function generateIndexAndTableOfContents() {
	for (const categories of Object.entries(tableOfContents)) {
		for (const content of tableOfContents[categories[0]]) {
			const raw = await fs.readFile(
				new URL(`documentation/${content.path}`, repositoryRoot),
				"utf-8",
			)
			const markdown = await convert(raw)

			if (content.startpage) {
				index["/documentation"] = markdown
				continue
			}

			index["/documentation/" + content.slug] = markdown

			if (!generatedTableOfContents[categories[0]]) {
				generatedTableOfContents[categories[0]] = [
					...tableOfContents[categories[0]].map((content: Record<string, any>) => ({
						...content,
						href: "/documentation/" + content.slug,
					})),
				]
			}
		}
	}
}
