import fs from "node:fs";
import tableOfContentsString from "../../../../../../blog/tableOfContents.json?raw";
import { parse } from "@opral/markdown-wc";
import { render } from "vike/abort";

const tableOfContents = JSON.parse(tableOfContentsString);

const renderedMarkdown = {} as Record<string, string>;

/* Slices the relative path to the repository, no matter where in the file system the code is executed from.
This is necessary because the code is executed from the build folder. */
const repositoryRoot = import.meta.url.slice(
	0,
	import.meta.url.lastIndexOf("inlang/packages")
);

export default async function onBeforeRender(pageContext: any) {
	const { id } = pageContext.routeParams;

	const page = tableOfContents.find((page: any) => page.slug === id);
	if (!page) {
		throw render(404);
	}

	const markdownFilePath = new URL(`inlang/blog/${page.path}`, repositoryRoot);

	if (!fs.existsSync(markdownFilePath)) {
		throw render(404);
	}

	const content = await parse(fs.readFileSync(markdownFilePath, "utf-8"));
	renderedMarkdown[id] = content.html;

	return {
		pageContext: {
			pageProps: {
				markdown: renderedMarkdown[id],
			},
		},
	};
}
