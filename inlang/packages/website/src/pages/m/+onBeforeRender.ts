import type { MarketplaceManifest } from "@inlang/marketplace-manifest";
import { registry } from "@inlang/marketplace-registry";
import { redirect } from "vike/abort";
import type { PageContext } from "vike/types";
import fs from "node:fs/promises";
import { parse } from "@opral/markdown-wc";
import type { PageProps } from "./+Page.jsx";
import { getRedirectPath } from "./helper/getRedirectPath.js";

const repositoryRoot = import.meta.url.slice(
	0,
	import.meta.url.lastIndexOf("inlang/packages")
);
let renderedMarkdown = {} as string | undefined;
//let tabelOfContents = {} as Record<string, Record<string, string[]>>
let pageData = {} as Record<string, unknown> | undefined;

/*
 * This function is called before rendering the page.
 *
 * @example
 * /m/sdjfhkj/fink-localization-editor/docs/usage
 *
 * uid -> sdjfhkj
 * currentSlug -> fink-localization-editor
 * itemPath -> /m/sdjfhkj/fink-localization-editor
 * pagePath -> /docs/usage
 *
 */
export default async function onBeforeRender(pageContext: PageContext) {
	renderedMarkdown = undefined;
	//tabelOfContents = {}
	pageData = undefined;

	// check if uid is defined
	const uid = pageContext.routeParams?.uid;
	if (!uid) redirect("/not-found", 301);

	// check if item for uid exists
	const item = registry.find(
		(item: any) => item.uniqueID === uid
	) as MarketplaceManifest & {
		uniqueID: string;
	};
	if (!item) throw redirect("/not-found", 301);

	// get corrected item slug; replace all dots with dashes; if no slug is defined, use the id
	const itemPath = `/m/${item.uniqueID}/${
		item.slug ? item.slug.replaceAll(".", "-") : item.id.replaceAll(".", "-")
	}`;

	// get the current slug
	const currentSlug = pageContext.urlParsed.pathname
		.split("/")
		.find((part) => part !== "m" && part !== uid && part.length !== 0);
	if (!currentSlug)
		throw (console.info("1"), redirect(itemPath as `/${string}`, 301));

	// get rest of the slug for in-product navigation
	const pagePath =
		pageContext.urlParsed.pathname.replace(`/m/${uid}/${currentSlug}`, "") ||
		"/";

	//check for redirects
	if (item.pageRedirects) {
		for (const [from, to] of Object.entries(item.pageRedirects)) {
			const newPagePath = getRedirectPath(pagePath, from, to);
			if (newPagePath) {
				throw (
					(console.info("2"),
					redirect((itemPath + newPagePath) as `/${string}`, 301))
				);
			}
		}
	}

	// check if slug is correct
	if (item.slug) {
		if (item.slug !== currentSlug) {
			throw (
				(console.info("3"),
				redirect((itemPath + pagePath) as `/${string}`, 301))
			);
		}
	} else {
		if (item.id.replaceAll(".", "-") !== currentSlug) {
			throw (
				(console.info("4"),
				redirect((itemPath + pagePath) as `/${string}`, 301))
			);
		}
	}

	//flatten pages
	const flattenPages = (
		pages: Record<string, string> | Record<string, Record<string, string>>
	) => {
		const flatPages: Record<string, string> = {};
		for (const [key, value] of Object.entries(pages)) {
			if (typeof value === "string") {
				flatPages[key] = value;
			} else {
				for (const [subKey, subValue] of Object.entries(value)) {
					// @ts-ignore
					flatPages[subKey] = subValue;
				}
			}
		}
		return flatPages;
	};

	if (item.pages) {
		// get content for each page
		for (const [slug, page] of Object.entries(flattenPages(item.pages))) {
			if (!page || !fileExists(page)) redirect(itemPath as `/${string}`, 301);

			if (slug === pagePath) {
				try {
					const content = await getContentString(page);
					const markdown = await parse(content);

					renderedMarkdown = markdown.html;
					if (markdown?.frontmatter) {
						pageData = markdown?.frontmatter;
					}
				} catch (error) {
					// pages do not getting prerendered because they are link
				}
			}
		}
	} else if (item.readme) {
		// get readme fallback
		const readme = () => {
			return typeof item.readme === "object" ? item.readme.en : item.readme;
		};

		// get contant and convert it to markdown
		try {
			const readmeMarkdown = await parse(await getContentString(readme()!));

			renderedMarkdown = readmeMarkdown.html;
			if (readmeMarkdown?.frontmatter) {
				pageData = readmeMarkdown?.frontmatter;
			}
		} catch (error) {
			console.error("Error while accessing the readme file");
			throw redirect("/not-found", 301);
		}
	} else {
		console.error("No pages defined for this product.");
		throw redirect("/not-found", 301);
	}

	//check if the markdown is available for this route
	if (renderedMarkdown === undefined) {
		console.error("No content available this route.");
		if (pagePath !== "/") {
			throw (console.info("5"), redirect(itemPath as `/${string}`, 301));
		} else {
			throw (console.info("6"), redirect("/not-found", 301));
		}
	}

	const recommends = item.recommends
		? registry.filter((i: any) => {
				for (const recommend of item.recommends!) {
					if (recommend.replace("m/", "") === i.uniqueID) return true;
					if (recommend.replace("g/", "") === i.uniqueID) return true;
				}
				return false;
			})
		: undefined;

	return {
		pageContext: {
			pageProps: {
				markdown: renderedMarkdown,
				pages: item.pages,
				pageData: pageData,
				pagePath,
				tableOfContents: {},
				manifest: item,
				recommends,
			} as PageProps,
		},
	};
}

const getContentString = (path: string) =>
	path.includes("http")
		? fetch(path).then((res) => res.text())
		: fs.readFile(new URL(path, repositoryRoot)).then((res) => res.toString());

const fileExists = async (path: string): Promise<boolean> => {
	try {
		// Check if it's a remote URL
		if (path.startsWith("http")) {
			const response = await fetch(path, { method: "HEAD" });
			return response.ok;
		} else {
			// Check if it's a local file
			await fs.access(new URL(path, repositoryRoot));
			return true;
		}
	} catch (error) {
		return false;
	}
};
