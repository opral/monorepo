import fs from "node:fs/promises"
import { registry } from "@inlang/marketplace-registry"

const siteURL = "https://inlang.com"

const locales = ["", "/de", "/fr", "/it", "/pt-BR", "/sk", "/zh"]

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
]

// Hardcoded categories for the marketplace
const categories = ["apps", "plugins", "lint-rules", "guides", "lix"]

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
			if (route.path !== "/editor")
				for (const locale of locales) {
					content = `${content}${formatPage(siteURL + locale + route.path, publishDate)}`
				}
			else content = `${content}${formatPage(siteURL + route.path, publishDate)}`

		if (route.dynamic && route.path === "/m") {
			for (const item of registry) {
				if (!item.id.startsWith("guide.")) {
					// TODO: Include locales again when markdown editor is ready
					// for (const locale of locales) {
					content = `${content}${formatPage(
						siteURL +
							// locale +
							route.path +
							"/" +
							item.uniqueID +
							"/" +
							(item.slug ? item.slug.replaceAll(".", "-") : item.id.replaceAll(".", "-")),
						publishDate
					)}`
					// }
				}
			}
		} else if (route.dynamic && route.path === "/g") {
			for (const item of registry) {
				if (item.id.startsWith("guide.")) {
					// TODO: Include locales again when markdown editor is ready
					// for (const locale of locales) {
					content = `${content}${formatPage(
						siteURL +
							// locale +
							route.path +
							"/" +
							item.uniqueID +
							"/" +
							(item.slug ? item.slug.replaceAll(".", "-") : item.id.replaceAll(".", "-")),
						publishDate
					)}`
					// }
				}
			}
		} else if (route.dynamic && route.path === "/c") {
			for (const category of categories) {
				for (const locale of locales) {
					content = `${content}${formatPage(
						siteURL + locale + route.path + "/" + category,
						publishDate
					)}`
				}
			}
		} else if (route.dynamic && route.path === "/documentation") {
			const sdkTableOfContents = await fs.readFile(
				new URL("./inlang" + route.path + "/sdk/tableOfContents.json", repositoryRoot),
				"utf-8"
			)
			const pluginTableOfContents = await fs.readFile(
				new URL("./inlang" + route.path + "/plugin/tableOfContents.json", repositoryRoot),
				"utf-8"
			)
			const lintRuleTableOfContents = await fs.readFile(
				new URL("./inlang" + route.path + "/lint-rule/tableOfContents.json", repositoryRoot),
				"utf-8"
			)

			if (
				Array.isArray(JSON.parse(sdkTableOfContents)) &&
				Array.isArray(JSON.parse(pluginTableOfContents)) &&
				Array.isArray(JSON.parse(lintRuleTableOfContents))
			) {
				const tableOfContents = [
					...JSON.parse(sdkTableOfContents),
					...JSON.parse(pluginTableOfContents),
					...JSON.parse(lintRuleTableOfContents),
				]
				for (const item of tableOfContents) {
					// for (const locale of locales) {
					// 	content = `${content}${formatPage(
					// 		siteURL + locale + route.path + "/" + item.slug,
					// 		publishDate
					// 	)}`
					// }
					content = `${content}${formatPage(siteURL + route.path + "/" + item.slug, publishDate)}`
				}
			} else {
				const tableOfContents = [
					...Object.values(JSON.parse(sdkTableOfContents)),
					...Object.values(JSON.parse(pluginTableOfContents)),
				]
				for (const items of tableOfContents) {
					for (const item of items) {
						if (item.slug !== "")
							// for (const locale of locales) {
							// 	content = `${content}${formatPage(
							// 		siteURL + locale + route.path + "/" + item.slug,
							// 		publishDate
							// 	)}`
							// }
							content = `${content}${formatPage(
								siteURL + route.path + "/" + item.slug,
								publishDate
							)}`
					}
				}
			}
		} else if (route.dynamic && route.path === "/blog") {
			const tableOfContents = await fs.readFile(
				new URL("./inlang" + route.path + "/tableOfContents.json", repositoryRoot),
				"utf-8"
			)

			if (Array.isArray(JSON.parse(tableOfContents))) {
				for (const item of JSON.parse(tableOfContents)) {
					// for (const locale of locales) {
					// 	content = `${content}${formatPage(
					// 		siteURL + locale + route.path + "/" + item.slug,
					// 		publishDate
					// 	)}`
					// }
					content = `${content}${formatPage(siteURL + route.path + "/" + item.slug, publishDate)}`
				}
			} else {
				for (const items of Object.values(JSON.parse(tableOfContents))) {
					for (const item of items) {
						if (item.slug !== "")
							// for (const locale of locales) {
							// 	content = `${content}${formatPage(
							// 		siteURL + locale + route.path + "/" + item.slug,
							// 		publishDate
							// 	)}`
							// }
							content = `${content}${formatPage(
								siteURL + route.path + "/" + item.slug,
								publishDate
							)}`
					}
				}
			}
		} else if (route.path === "/newsletter") {
			for (const locale of locales) {
				content = `${content}${formatPage(siteURL + locale + route.path, publishDate)}`
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
