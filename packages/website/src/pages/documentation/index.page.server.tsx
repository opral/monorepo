import fs from "node:fs/promises"
import sdkTableOfContents from "../../../../../documentation/sdk/tableOfContents.json"
import pluginTableOfContents from "../../../../../documentation/plugin/tableOfContents.json"
import lintRuleTableOfContents from "../../../../../documentation/lint-rule/tableOfContents.json"
import { convert } from "@inlang/markdown"
import { render, redirect } from "vike/abort"

const renderedMarkdown = {} as Record<string, string>

const redirectLinks = [
	{
		from: "/documentation/apps/ide-extension",
		to: "/m/r7kp499g/app-inlang-ideExtension",
	},
	{
		from: "/documentation/apps/inlang-cli",
		to: "/m/2qj2w8pu/app-inlang-cli",
	},
	{
		from: "/documentation/plugins/registry",
		to: "/",
	},
	{
		from: "/documentation/sdk/overview",
		to: "/documentation",
	},
	{
		from: "/documentation/badge",
		to: "/m/zu942ln6/app-inlang-badge",
	},
	{
		from: "/documentation/sdk",
		to: "/documentation",
	},
]

/* Slices the relative path to the repository, no matter where in the file system the code is executed from.
This is necessary because the code is executed from the build folder. */
const repositoryRoot = import.meta.url.slice(0, import.meta.url.lastIndexOf("inlang/source-code"))

export async function onBeforeRender(pageContext: any) {
	const slug =
		pageContext.urlPathname === "/documentation"
			? ""
			: pageContext.urlPathname.replace("/documentation/", "")

	// Look for redirects
	for (const redirectLink of redirectLinks) {
		if (redirectLink.from === pageContext.urlPathname)
			throw redirect(
				// @ts-ignore
				redirectLink.to.startsWith("/") ? redirectLink.to : `/${redirectLink.to}`
			)
	}

	if (renderedMarkdown[slug] === undefined) {
		// get sdk documentation
		for (const categories of Object.entries(sdkTableOfContents)) {
			const [, pages] = categories
			for (const page of pages) {
				const text = await fs.readFile(
					new URL(`inlang/documentation/sdk/${page.path}`, repositoryRoot),
					"utf-8"
				)
				const markdown = await convert(text)
				renderedMarkdown[page.slug] = markdown
			}
		}
		//get plugin documentation
		for (const categories of Object.entries(pluginTableOfContents)) {
			const [, pages] = categories

			for (const page of pages) {
				const text = await fs.readFile(
					new URL(`inlang/documentation/plugin/${page.path}`, repositoryRoot),
					"utf-8"
				)
				const markdown = await convert(text)
				renderedMarkdown[page.slug] = markdown
			}
		}
		//get lint rule documentation
		for (const categories of Object.entries(lintRuleTableOfContents)) {
			const [, pages] = categories

			for (const page of pages) {
				const text = await fs.readFile(
					new URL(`inlang/documentation/lint-rule/${page.path}`, repositoryRoot),
					"utf-8"
				)
				const markdown = await convert(text)
				renderedMarkdown[page.slug] = markdown
			}
		}
	}

	if (renderedMarkdown[slug] === undefined) {
		throw render(404)
	}

	return {
		pageContext: {
			pageProps: {
				markdown: renderedMarkdown[slug],
			},
		},
	}
}
