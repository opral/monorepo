import {
	RequiredFrontmatter,
	z,
} from "@inlang/website/src/services/markdown/index.js";

/**
 * The frontmatter schema used to validate the markdown files in this directory.
 */
export type FrontmatterSchema = z.infer<typeof FrontmatterSchema>;
export const FrontmatterSchema = RequiredFrontmatter.extend({
	summary: z
		.string({ description: "A brief summary to preview the post." })
		.min(100)
		.max(1000),
});

/**
 * The table of contents is a simple list with the file name.
 *
 * The ordering in the array determines the position in the blog.
 */
export const tableOfContents: string[] = ["./001-git-as-backend/index.md"];

/**
 * The absolute path to this file. Is used to prefix the relative paths in tableOfContents.
 */
export const pathToFile = new URL(".", import.meta.url).pathname;
