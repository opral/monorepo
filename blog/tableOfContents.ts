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
export const tableOfContents: string[] = [
	// @ts-expect-error
	(await import("./001-git-as-backend/index.md?raw")).default,
];
