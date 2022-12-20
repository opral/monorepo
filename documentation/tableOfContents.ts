import { RequiredFrontmatter } from "@inlang/website/src/services/markdown/index.js";

/**
 * The frontmatter schema used to validate the markdown files in this directory.
 */
export const FrontmatterSchema = RequiredFrontmatter;

/**
 * The table of contents split by categories.
 */
export const tableOfContents: Record<string, string[]> = {
	Overview: [
		// @ts-ignore
		(await import("./intro.md?raw")).default,
		// @ts-ignore
		(await import("./design-principles.md?raw")).default,
	],
	// "Getting Started": [],
	// Reference: [],
};
