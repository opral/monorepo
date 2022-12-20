import { RequiredFrontmatter } from "@inlang/website/src/services/markdown/index.js";

/**
 * The frontmatter schema used to validate the markdown files in this directory.
 */
export const FrontmatterSchema = RequiredFrontmatter;

/**
 * The table of contents split by categories.
 */
export const tableOfContents: Record<string, string[]> = {
	Introduction: ["./intro.md"],
};

/**
 * The absolute path to this file. Is used to prefix the relative paths in tableOfContents.
 */
export const pathToFile = new URL(".", import.meta.url).pathname;
