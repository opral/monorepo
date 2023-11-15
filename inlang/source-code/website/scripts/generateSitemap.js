import fs from "node:fs/promises"
import { registry } from "@inlang/marketplace-registry"

const siteURL = "https://inlang.com"

// Add all routes that should be included in the sitemap here, dynamic routes should be marked with dynamic: true
const routes = [
	{ path: "/", dynamic: false },
	{ path: "/blog", dynamic: true },
	{ path: "/c", dynamic: true },
	{ path: "/documentation", dynamic: true },
	{ path: "/g", dynamic: true },
	{ path: "/m", dynamic: true },
	{ path: "/newsletter", dynamic: false },
	{ path: "/search", dynamic: false },
	{ path: "/editor", dynamic: false },
]

// Hardcoded categories for the marketplace
const categories = ["application", "website", "markdown", "lint-rules"]

const repositoryRoot = import.meta.url.slice(0, import.meta.url.lastIndexOf("inlang/source-code"))

// Formats a page for the sitemap
function formatPage(name, published) {
	return `\n  <url>\n    <loc>${name}</loc>\n    <lastmod>${published}</lastmod>\n  </url>`
}

async function generateSitemap() {
	const publishDate = new Date().toISOString()
	let content = `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="https://www.nsb.com/wp-content/plugins/wordpress-seo-premium/css/main-sitemap.xsl"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`
	for (const route of routes) {
		if (route.path !== "/c" && route.path !== "/g" && route.path !== "/m")
			content = `${content}${formatPage(siteURL + route.path, publishDate)}`

		if (route.dynamic && route.path === "/m") {
			for (const item of registry) {
				if (!item.id.startsWith("guide.")) {
					content = `${content}${formatPage(
						siteURL + route.path + "/" + item.uniqueID + "/" + item.id.replaceAll(".", "-"),
						publishDate
					)}`
				}
			}
		} else if (route.dynamic && route.path === "/g") {
			for (const item of registry) {
				if (item.id.startsWith("guide.")) {
					content = `${content}${formatPage(
						siteURL + route.path + "/" + item.uniqueID + "/" + item.id.replaceAll(".", "-"),
						publishDate
					)}`
				}
			}
		} else if (route.dynamic && route.path === "/c") {
			for (const category of categories) {
				content = `${content}${formatPage(siteURL + route.path + "/" + category, publishDate)}`
			}
		} else if ((route.dynamic && route.path === "/documentation") || route.path === "/blog") {
			const tableOfContents = await fs.readFile(
				new URL("./inlang" + route.path + "/tableOfContents.json", repositoryRoot),
				"utf-8"
			)

			if (Array.isArray(JSON.parse(tableOfContents))) {
				for (const item of JSON.parse(tableOfContents)) {
					content = `${content}${formatPage(siteURL + route.path + "/" + item.slug, publishDate)}`
				}
			} else {
				for (const items of Object.values(JSON.parse(tableOfContents))) {
					for (const item of items) {
						if (item.slug !== "")
							content = `${content}${formatPage(
								siteURL + route.path + "/" + item.slug,
								publishDate
							)}`
					}
				}
			}
		}
	}

	content = `${content}\n</urlset>`
	await fs.writeFile(
		new URL("./inlang/source-code/website/public/sitemap.xml", repositoryRoot),
		content
	)

	console.info("Sitemap successfully generated")
}

generateSitemap()
