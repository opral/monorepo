import type { OnBeforeRender } from "@src/renderer/types.js";
import type { PageProps } from "./index.page.jsx";
// import {
// 	tableOfContents,
// 	pathToFile,
// 	FrontmatterSchema,
// } from "../../../../../../documentation/tableOfContents.js";
import fs from "node:fs";
import { parseMarkdown, markdownIndex } from "@src/services/markdown/index.js";

console.log("re-running server.tsx");

export type ProcessedTableOfContents = Record<
	string,
	// documents (re-creating the tableOfContents type to omit html)
	Omit<typeof markdownIndex[keyof typeof markdownIndex], "html">[]
>;

// should only run server side
export const onBeforeRender: OnBeforeRender<PageProps> = async (
	pageContext
) => {
	console.log("rerunning on before render");
	return {
		pageContext: {
			pageProps: {
				markdown: markdownIndex[pageContext.urlPathname],
				processedTableOfContents: {},
			},
		},
	};
};

/**
 * the table of contents without the html for each document
 * saving bandwith and speeding up the site)
 */
// const processedTableOfContents = Object.fromEntries(
// 	Object.entries(tableOfContents).map(([section, documents]) => [
// 		section,
// 		documents.map((documentPath) => {
// 			const text = fs.readFileSync(pathToFile + documentPath, "utf-8");
// 			const markdown = parseMarkdown({ text, FrontmatterSchema });
// 			return {
// 				frontmatter: markdown.frontmatter,
// 			};
// 		}),
// 	])
// ) as ProcessedTableOfContents;
