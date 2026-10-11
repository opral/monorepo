import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const clientDist = path.resolve(process.cwd(), "dist/client");

// Marketplace pages that redirect to a standalone website.
// Keep in sync with `standaloneSites` in src/marketplace/legacyRedirects.ts.
const standaloneSitePaths = [
	"/m/gerre34r/library-inlang-paraglideJs",
	"/m/tdozzpar/app-inlang-finkLocalizationEditor",
];

function isRedirectedPath(pathname) {
	if (
		standaloneSitePaths.some(
			(basePath) =>
				pathname === basePath ||
				pathname === `${basePath}/` ||
				pathname.startsWith(`${basePath}/`)
		)
	) {
		return true;
	}

	if (
		pathname.startsWith("/m/dxnzrydw/") ||
		pathname.startsWith("/m/osslbuzt/") ||
		pathname.startsWith("/m/iljlwzfs/")
	) {
		return true;
	}

	return (
		pathname === "/blog/tanstack-ci" ||
		pathname === "/blog/tanstack-ci/" ||
		pathname === "/blog/dont-lazy-load" ||
		pathname === "/blog/dont-lazy-load/"
	);
}

const pagesPath = path.join(clientDist, "pages.json");
if (existsSync(pagesPath)) {
	const pagesData = JSON.parse(readFileSync(pagesPath, "utf8"));
	pagesData.pages = pagesData.pages?.filter(
		(page) => !isRedirectedPath(page.path)
	);
	writeFileSync(pagesPath, `${JSON.stringify(pagesData, null, 2)}\n`);
}

const sitemapPath = path.join(clientDist, "sitemap.xml");
if (existsSync(sitemapPath)) {
	const sitemap = readFileSync(sitemapPath, "utf8");
	const cleaned = sitemap.replace(
		/\s*<url>\s*<loc>([^<]+)<\/loc>[\s\S]*?<\/url>/g,
		(entry, loc) => {
			try {
				return isRedirectedPath(new URL(loc).pathname) ? "" : entry;
			} catch {
				return entry;
			}
		}
	);
	writeFileSync(sitemapPath, cleaned);
}
