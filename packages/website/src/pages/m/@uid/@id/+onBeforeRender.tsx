import { registry } from "@inlang/marketplace-registry"
import { convert } from "@inlang/markdown"
import type { PageContext } from "#src/renderer/types.js"
import type { PageProps } from "./+Page.jsx"
import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import fs from "node:fs/promises"
import { redirect } from "vike/abort"
import cheerio from "cheerio"

const repositoryRoot = import.meta.url.slice(0, import.meta.url.lastIndexOf("inlang/source-code"))

async function fileExists(path: string): Promise<boolean> {
	try {
		// Check if it's a remote URL
		if (path.startsWith("http")) {
			const response = await fetch(path, { method: "HEAD" })
			return response.ok
		} else {
			// Check if it's a local file
			await fs.access(new URL(path, repositoryRoot))
			return true
		}
	} catch (error) {
		return false
	}
}

export default async function onBeforeRender(pageContext: PageContext) {
	const tab = pageContext.urlParsed.search.view === "changelog" ? "changelog" : "documentation"

	const item = registry.find(
		(item: any) => item.uniqueID === pageContext.routeParams.uid
	) as MarketplaceManifest & { uniqueID: string }

	if (!item || item.id.split(".")[0] === "guide") throw redirect("/m/404")

	if (item.id.replaceAll(".", "-").toLowerCase() !== pageContext.routeParams.id?.toLowerCase()) {
		throw redirect(`/m/${item.uniqueID}/${item.id.replaceAll(".", "-").toLowerCase()}`)
	}

	const readme = () => {
		return typeof item.readme === "object" ? item.readme.en : item.readme
	}

	const changelog = async () => {
		const changelogPath = readme().replace(/\/[^/]*$/, "/CHANGELOG.md")

		if (await fileExists(changelogPath)) {
			return changelogPath
		} else {
			return undefined
		}
	}

	const text = (path: string) =>
		path.includes("http")
			? fetch(path).then((res) => res.text())
			: fs.readFile(new URL(path, repositoryRoot)).then((res) => res.toString())

	const readmeMarkdown = await convert(await text(readme()))
	const changelogPath = await changelog()

	const changelogMarkdown = changelogPath ? await convert(await text(changelogPath)) : undefined

	const recommends = item.recommends
		? registry.filter((i: any) => {
				for (const recommend of item.recommends!) {
					if (recommend.replace("m/", "") === i.uniqueID) return true
				}
				return false
		  })
		: undefined

	const tableOfContents = await generateTableOfContents(
		tab === "changelog" ? changelogMarkdown : readmeMarkdown
	)

	return {
		pageContext: {
			pageProps: {
				markdown: tab === "changelog" ? changelogMarkdown : readmeMarkdown,
				tab: changelogMarkdown ? tab : undefined,
				tableOfContents: tableOfContents,
				manifest: item,
				recommends: recommends,
			} as PageProps,
		},
	}
}

const generateTableOfContents = async (markdown: any) => {
	const table = {}

	if (
		markdown &&
		markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g) &&
		markdown.match(/<h[1].*?>(.*?)<\/h[1]>/g)
	) {
		const headings = markdown.match(/<h[1-3].*?>(.*?)<\/h[1-3]>/g)

		for (const heading of headings) {
			const $ = cheerio.load(heading)
			const text = $("h1, h2, h3").text()

			if (text) {
				if ($("h1").length > 0) {
					// @ts-ignore
					table[text.replace(/(<([^>]+)>)/gi, "").replace("#", "")] = []
				} else if (Object.keys(table).length > 0) {
					const lastH1Key = Object.keys(table).pop()
					// @ts-ignore
					table[lastH1Key].push(text.replace(/(<([^>]+)>)/gi, "").replace("#", ""))
				}
			}
		}
	}

	return table
}
