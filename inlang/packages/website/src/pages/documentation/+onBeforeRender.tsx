import fs from "node:fs/promises";
import ecosystemTableOfContentsRaw from "../../../../../documentation/ecosystem/tableOfContents.json?raw";
import sdkTableOfContentsRaw from "../../../../../documentation/sdk/tableOfContents.json?raw";
import pluginTableOfContentsRaw from "../../../../../documentation/plugin/tableOfContents.json?raw";
import lintRuleTableOfContentsRaw from "../../../../../documentation/lint-rule/tableOfContents.json?raw";
import { parse } from "@opral/markdown-wc";
import { render, redirect } from "vike/abort";

const ecosystemTableOfContents = JSON.parse(ecosystemTableOfContentsRaw);
const sdkTableOfContents = JSON.parse(sdkTableOfContentsRaw);
const pluginTableOfContents = JSON.parse(pluginTableOfContentsRaw);
const lintRuleTableOfContents = JSON.parse(lintRuleTableOfContentsRaw);

const renderedMarkdown = {} as Record<string, string>;

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
		from: "/documentation/build-app",
		to: "/documentation/sdk/build-app",
	},
	{
		from: "/documentation/publish-to-marketplace",
		to: "/documentation/sdk/publish-to-marketplace",
	},
	{
		from: "/documentation/publish-guide",
		to: "/documentation/sdk/publish-guide",
	},
];

/* Slices the relative path to the repository, no matter where in the file system the code is executed from.
This is necessary because the code is executed from the build folder. */
const repositoryRoot = import.meta.url.slice(
	0,
	import.meta.url.lastIndexOf("inlang/packages")
);

export default async function onBeforeRender(pageContext: any) {
	const slug =
		pageContext.urlPathname === "/documentation"
			? ""
			: pageContext.urlPathname.replace("/documentation/", "");
	// Look for redirects
	for (const redirectLink of redirectLinks) {
		if (redirectLink.from === pageContext.urlPathname)
			throw redirect(
				// @ts-ignore
				redirectLink.to.startsWith("/")
					? redirectLink.to
					: `/${redirectLink.to}`
			);
	}

	if (renderedMarkdown[slug] === undefined) {
		// get ecosystem documentation
		for (const categories of Object.entries(ecosystemTableOfContents)) {
			const [, pages] = categories as any;

			for (const page of pages) {
				const text = await fs.readFile(
					new URL(
						`inlang/documentation/ecosystem/${page.path}`,
						repositoryRoot
					),
					"utf-8"
				);
				const markdown = await parse(text);
				renderedMarkdown[page.slug] = markdown.html;
			}
		}
		//get sdk documentation
		for (const categories of Object.entries(sdkTableOfContents)) {
			const [, pages] = categories as any;

			for (const page of pages) {
				const text = await fs.readFile(
					new URL(`inlang/documentation/sdk/${page.path}`, repositoryRoot),
					"utf-8"
				);
				const markdown = await parse(text);
				renderedMarkdown[page.slug] = markdown.html;
			}
		}
		//get plugin documentation
		for (const categories of Object.entries(pluginTableOfContents)) {
			const [, pages] = categories as any;

			for (const page of pages) {
				const text = await fs.readFile(
					new URL(`inlang/documentation/plugin/${page.path}`, repositoryRoot),
					"utf-8"
				);
				const markdown = await parse(text);
				renderedMarkdown[page.slug] = markdown.html;
			}
		}
		//get lint rule documentation
		for (const categories of Object.entries(lintRuleTableOfContents)) {
			const [, pages] = categories as any;

			for (const page of pages) {
				const text = await fs.readFile(
					new URL(
						`inlang/documentation/lint-rule/${page.path}`,
						repositoryRoot
					),
					"utf-8"
				);
				const markdown = await parse(text);
				renderedMarkdown[page.slug] = markdown.html;
			}
		}
	}

	if (renderedMarkdown[slug] === undefined) {
		throw render(404);
	}

	return {
		pageContext: {
			pageProps: {
				slug,
				markdown: renderedMarkdown[slug],
			},
		},
	};
}
