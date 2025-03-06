import fs from "node:fs/promises"
import { registry } from "@inlang/marketplace-registry"

const siteURL = "https://inlang.com"

const locales = ["", "/de", "/fr", "/it", "/pt-BR", "/sk", "/zh"]

// Add all routes that should be included in the sitemap here, dynamic routes should be marked with dynamic: true
const routes = [
	{ path: "/", dynamic: false },
	{ path: "/c", dynamic: true },
	{ path: "/g", dynamic: true },
	{ path: "/m", dynamic: true },
	{ path: "/search", dynamic: false },
];

// Hardcoded categories for the marketplace
const categories = ["apps", "plugins", "lint-rules", "guides"];

const repositoryRoot = import.meta.url.slice(
	0,
	import.meta.url.lastIndexOf("inlang/packages")
);

// Formats a page for the sitemap
function formatPage(name, published) {
	return `\n  <url>\n    <loc>${name}</loc>\n    <lastmod>${published}</lastmod>\n  </url>`;
}

async function generateSitemap() {
	const publishDate = new Date().toISOString();
	let content = `<?xml version="1.0" encoding="UTF-8"?>\n<?xml-stylesheet type="text/xsl" href="https://www.nsb.com/wp-content/plugins/wordpress-seo-premium/css/main-sitemap.xsl"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;
	for (const route of routes) {
		if (route.path !== "/c" && route.path !== "/g" && route.path !== "/m")
			if (route.path !== "/editor")
				for (const locale of locales) {
					content = `${content}${formatPage(
						siteURL + locale + (route.path !== "/" ? route.path : ""),
						publishDate
					)}`;
				}
			else
				content = `${content}${formatPage(siteURL + route.path, publishDate)}`;

		if (route.dynamic && route.path === "/m") {
			for (const item of registry) {
				if (!item.id.startsWith("guide.")) {
					if (item.pages) {
						for (const [key, value] of Object.entries(item.pages)) {
							if (typeof value === "string") {
								const restSlug = key;
								content = `${content}${formatPage(
									siteURL +
										// locale +
										route.path +
										"/" +
										item.uniqueID +
										"/" +
										(item.slug
											? item.slug.replaceAll(".", "-")
											: item.id.replaceAll(".", "-")) +
										(restSlug !== "/" ? restSlug : ""),
									publishDate
								)}`;
							} else {
								for (const [restSlug, path] of Object.entries(value)) {
									if (
										!path.startsWith("http") &&
										!path.startsWith("https") &&
										!path.startsWith("/")
									) {
										content = `${content}${formatPage(
											siteURL +
												// locale +
												route.path +
												"/" +
												item.uniqueID +
												"/" +
												(item.slug
													? item.slug.replaceAll(".", "-")
													: item.id.replaceAll(".", "-")) +
												(restSlug !== "/" ? restSlug : ""),
											publishDate
										)}`;
									}
								}
							}
						}
					} else {
						content = `${content}${formatPage(
							siteURL +
								// locale +
								route.path +
								"/" +
								item.uniqueID +
								"/" +
								(item.slug
									? item.slug.replaceAll(".", "-")
									: item.id.replaceAll(".", "-")),
							publishDate
						)}`;
					}
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
							(item.slug
								? item.slug.replaceAll(".", "-")
								: item.id.replaceAll(".", "-")),
						publishDate
					)}`;
					// }
				}
			}
		} else if (route.dynamic && route.path === "/c") {
			for (const category of categories) {
				for (const locale of locales) {
					content = `${content}${formatPage(
						siteURL + locale + route.path + "/" + category,
						publishDate
					)}`;
				}
			}
		}
	}

	content = `${content}\n</urlset>`;
	await fs.writeFile(
		new URL("./inlang/packages/website/public/sitemap.xml", repositoryRoot),
		content
	);

	console.info("Sitemap successfully generated");
}

generateSitemap()
