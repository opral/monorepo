import type { OnBeforeRender } from "@src/renderer/types.js";
import type { PageProps } from "./index.page.jsx";
import {
	tableOfContents,
	FrontmatterSchema,
} from "../../../../../../content/blog/tableOfContents.js";
import fs from "node:fs";
import { parseMarkdown } from "@src/services/markdown/index.js";

/**
 * the table of contents without the html for each document
 * saving bandwith and speeding up the site
 */
export type ProcessedTableOfContents = Record<
	string,
	ReturnType<typeof parseMarkdown<FrontmatterSchema>>["frontmatter"]
>;

/**
 * The index of documentation markdown files. The href's acts as id.
 *
 * @example
 * 	{
 * 		"/documentation/intro": document,
 * 	}
 */
let index: Record<
	string,
	ReturnType<typeof parseMarkdown<FrontmatterSchema>>
> = {};

/**
 * the table of contents without the html for each document
 * saving bandwith and speeding up the site)
 */
let processedTableOfContents: ProcessedTableOfContents = {};

generateIndexAndTableOfContents();

// should only run server side
export const onBeforeRender: OnBeforeRender<PageProps> = async (
	pageContext
) => {
	// dirty way to get reload of markdown (not hot reload though)
	if (import.meta.env.DEV) {
		generateIndexAndTableOfContents();
	}
	return {
		pageContext: {
			pageProps: {
				markdown: index[pageContext.urlPathname],
				processedTableOfContents: processedTableOfContents,
			},
		},
	};
};

/**
 * Generates the index and table of contents.
 */
async function generateIndexAndTableOfContents() {
	for (const document of tableOfContents) {
		const markdown = parseMarkdown<FrontmatterSchema>({
			text: document,
			FrontmatterSchema,
		});
		// not pushing to processedTableOfContents directly in case
		// the category is undefined so far
		processedTableOfContents[markdown.frontmatter.href] = markdown.frontmatter;

		index[markdown.frontmatter.href] = markdown;
	}
}
