import { convert } from "@inlang/markdown"
import { RenderErrorPage } from "vite-plugin-ssr/RenderErrorPage"
import fs from "node:fs/promises"
import tableOfContents from "../../../../../documentation/tableOfContents.json"
import type { OnBeforeRender } from "#src/renderer/types.js"
import type { PageProps } from "./index.page.jsx"

const repositoryRoot = new URL("../../../../../", import.meta.url)

export type ProcessedTableOfContents = Record<
	string,
	{ slug: string; pageTitle: string; anchors: string[] }[]
>

const index: Record<string, Awaited<ReturnType<typeof convert>>> = {}
const processedTableOfContents: ProcessedTableOfContents = {}

await generateIndexAndTableOfContents()

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

/* Generates the content and the tableOfContents as object for the navigation */
async function generateIndexAndTableOfContents() {
	const pageTitles: Record<string, string[]> = {}
	const anchors: Record<string, string[]> = {}

	for (const [category, documents] of Object.entries(tableOfContents)) {
		/* Render the startpage of the document */
		if (category === "Startpage") {
			const raw = await fs.readFile(new URL(`documentation/${documents}`, repositoryRoot), {
				encoding: "utf-8",
			})
			index["/documentation"] = await convert(raw)

			processedTableOfContents[category] = [
				{
					slug: "",
					pageTitle:
						raw.match(/(?<=#)(.*)(?=\n)/)?.[0] ?? raw.match(/(?<=#)(.*)/)?.[0] ?? "##" ?? "###",
					anchors: [],
				},
			]
			continue
		}

		/* Render the rest of the tableOfContents */
		for (const document of documents) {
			const slug = document.replace(/\.md$/, "").replace("./", "").replace("/", "-").toLowerCase()

			const raw = await fs.readFile(new URL(`documentation/${document}`, repositoryRoot), {
				encoding: "utf-8",
			})

			/* Searches for the first title in the markdown file like that and push it like index does it: raw.match(/(?<=#)(.*)(?=\n)/)?.[0] ?? raw.match(/(?<=#)(.*)/)?.[0] ?? "##" ?? "###",
			 */
			const pageTitle =
				raw.match(/(?<=#)(.*)(?=\n)/)?.[0] ?? raw.match(/(?<=#)(.*)/)?.[0] ?? "##" ?? "###"
			if (pageTitles[category] === undefined) {
				pageTitles[category] = []
			}
			pageTitles[category]?.push(pageTitle)

			/* Searches for all h1, h2, h3 titles in the markdown file and pushs it to anchors for them to be clickable */
			const headings =
				raw
					.match(/^(#{1,3})\s+(.*?)(?=\n)/gm)
					?.map((heading) => heading.replace(/#/g, "").trim().replaceAll(".", "")) || []

			if (anchors[category] === undefined) {
				anchors[category] = {}
			}
			anchors[category][slug] = headings

			const markdown = await convert(raw)

			index[`/documentation/${slug.replace("-", "/")}`] = markdown
		}

		processedTableOfContents[category] = documents.map((document: string) => {
			const slug = document.replace(/\.md$/, "").replace("./", "").replace("/", "-").toLowerCase()
			return {
				slug,
				pageTitle: pageTitles[category]!.shift()!,
				anchors: anchors[category][slug],
			}
		})
	}
}
