import type { MarketplaceManifest } from "@inlang/marketplace-manifest"
import { registry } from "@inlang/marketplace-registry"
import { redirect } from "vike/abort"
import type { PageContext } from "vike/types"
import fs from "node:fs/promises"
import { convert } from "@inlang/markdown"
import type { PageProps } from "./+Page.jsx"

const repositoryRoot = import.meta.url.slice(0, import.meta.url.lastIndexOf("inlang/source-code"))
const renderedMarkdown = {} as Record<string, string>

export default async function onBeforeRender(pageContext: PageContext) {
	// check if uid is defined
	const uid = pageContext.routeParams?.uid
	if (!uid) redirect("/not-found", 301)

	// check if item is valid
	const item = registry.find((item: any) => item.uniqueID === uid) as MarketplaceManifest & {
		uniqueID: string
	}
	if (!item) throw redirect("/not-found", 301)

	// check if slug is defined
	const slug = pageContext.routeParams?.slug
	if (!slug) throw redirect("/not-found", 301)

	// get rest of the slug for in-product navigation
	const restSlug = pageContext.urlParsed.pathname.replace(`/m/${uid}/${slug}`, "") || "/"

	// check if slug is correct
	if (item.slug) {
		if (item.slug !== slug) {
			throw redirect(
				`/m/${item.uniqueID}/${
					item.slug
						? item.slug.replaceAll(".", "-") + restSlug
						: item.id.replaceAll(".", "-") + restSlug
				}`,
				301
			)
		}
	} else {
		if (item.id.replaceAll(".", "-") !== slug) {
			throw redirect(
				`/m/${item.uniqueID}/${
					item.slug
						? item.slug.replaceAll(".", "-") + restSlug
						: item.id.replaceAll(".", "-") + restSlug
				}`,
				301
			)
		}
	}

	if (item.pages) {
		// get content for each page
		for (const [slug, page] of Object.entries(item.pages)) {
			if (!page || !fileExists(page)) redirect("/not-found", 301)

			const content = await getContentString(page)
			const markdown = await convert(content)

			renderedMarkdown[slug] = markdown
		}
	} else if (item.readme) {
		// get readme fallback
		const readme = () => {
			return typeof item.readme === "object" ? item.readme.en : item.readme
		}

		// get contant and convert it to markdown
		try {
			const readmeMarkdown = await convert(await getContentString(readme()!))
			renderedMarkdown["/"] = readmeMarkdown
		} catch (error) {
			console.error("Error while accessing the readme file")
			throw redirect("/not-found", 301)
		}
	} else {
		console.error("No pages defined for this product.")
		throw redirect("/not-found", 301)
	}

	//check if the markdown is available for this route
	if (renderedMarkdown[restSlug] === undefined) {
		console.error("No content available this route.")
		throw redirect("/not-found", 301)
	}

	return {
		pageContext: {
			pageProps: {
				markdown: renderedMarkdown[restSlug],
				pages: item.pages,
				restSlug,
				tableOfContents: {},
				manifest: item,
				recommends: [],
			} as PageProps,
		},
	}
}

const getContentString = (path: string) =>
	path.includes("http")
		? fetch(path).then((res) => res.text())
		: fs.readFile(new URL(path, repositoryRoot)).then((res) => res.toString())

const fileExists = async (path: string): Promise<boolean> => {
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
