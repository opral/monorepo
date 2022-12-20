import type { OnBeforeRender } from "@src/renderer/types.js";
import type { PageProps } from "./index.page.jsx";
import {
	tableOfContents,
	FrontmatterSchema,
	pathToFile,
} from "../../../../../../documentation/tableOfContents.js";
import fs from "node:fs";
import { parseMarkdown } from "@src/services/markdown/index.js";

export type ProcessedTableOfContents = Record<
	string,
	// documents (re-creating the tableOfContents type to omit html)
	Omit<typeof index[keyof typeof index], "html">[]
>;

/**
 * The index of documentation markdown files. The href's acts as id.
 *
 * @example
 * 	{
 * 		"/documentation/intro": document,
 * 	}
 */
let index: Record<string, ReturnType<typeof parseMarkdown>> = {};

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
	for (const [category, documents] of Object.entries(tableOfContents)) {
		let frontmatters: { frontmatter: any }[] = [];
		for (const documentPath of documents) {
			const text = fs.readFileSync(pathToFile + documentPath, "utf-8");
			const markdown = parseMarkdown({ text, FrontmatterSchema });
			// not pushing to processedTableOfContents directly in case
			// the category is undefined so far
			frontmatters.push({ frontmatter: markdown.frontmatter });
			index[markdown.frontmatter.href] = markdown;
		}
		processedTableOfContents[category] = frontmatters;
	}
}
