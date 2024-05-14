import type { MarketplaceManifest } from "@inlang/marketplace-manifest"

export const getGithubLink = (manifest: MarketplaceManifest, currentRoute: string) => {
	let link: string | undefined
	if (manifest.pages) {
		for (const [key, value] of Object.entries(manifest.pages)) {
			if (typeof value === "string" && key === currentRoute) {
				link = value
			} else if (typeof value === "object") {
				for (const [route, path] of Object.entries(value)) {
					if (route === currentRoute) {
						link = path as string
					}
				}
			}
		}
	} else {
		const route = typeof manifest.readme === "object" ? manifest.readme.en : manifest.readme
		link = route
	}

	const isExternal = link?.includes("http")

	if (isExternal) {
		if (link?.includes("https://github.com")) {
			return link
		} else if (link?.includes("https://cdn.jsdelivr.net/gh/")) {
			const owner = link.replace("https://cdn.jsdelivr.net/gh/", "").split("/")[0]
			const repo = link.replace("https://cdn.jsdelivr.net/gh/", "").split("/")[1]?.includes("@")
				? link.replace("https://cdn.jsdelivr.net/gh/", "").split("/")[1]?.split("@")[0]
				: link.replace("https://cdn.jsdelivr.net/gh/", "").split("/")[1]
			const rest = link.replace("https://cdn.jsdelivr.net/gh/", "").split("/").slice(2).join("/")

			return `https://github.com/${owner}/${repo}/blob/main/${rest}`
		}
	}

	const owner = "opral"
	const repo = "monorepo"

	return `https://github.com/${owner}/${repo}/blob/main/${link?.replace("./", "")}`
}
