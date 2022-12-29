import Markdoc, { type ValidationError } from "@markdoc/markdoc";
import { parse as parseYaml } from "yaml";
import { renderMarkdownToString } from "./solidPlugin.js";
import { z } from "zod";
import { components, config } from "./config.js";

/**
 * The frontmatter that is required by the markdown service.
 *
 * `href` the url slug e.g. /documentation/intro
 * `title` the title of the document
 *
 * See https://markdoc.dev/docs/frontmatter
 */
export type RequiredFrontmatter = z.infer<typeof RequiredFrontmatter>;
export const RequiredFrontmatter = z.object({
	href: z
		.string({
			description:
				"The href is the path where the markdown is rendered e.g. /documentation/intro and simultaneously acts as id.",
		})
		.startsWith("/"),
	title: z.string(),
	description: z
		.string({ description: "Description for SEO and prerendering purposes." })
		.min(10)
		.max(160),
});

/**
 * Renders a Markdoc document.
 *
 * Provide the markdown document as a string, the
 * function returns the rendered body of the markdown
 * as string and the [frontmatter](https://markdoc.dev/docs/frontmatter).
 *
 * @returns either error or html for a given document
 */
export async function parseMarkdown<
	FrontmatterSchema extends RequiredFrontmatter
>(args: {
	text: string;
	FrontmatterSchema: typeof RequiredFrontmatter;
}): Promise<{
	frontmatter: FrontmatterSchema;
	html?: string;
	error?: string;
}> {
	const ast = Markdoc.parse(args.text);
	const frontmatter = args.FrontmatterSchema.parse(
		parseYaml(ast.attributes.frontmatter ?? "")
	);
	const errors = Markdoc.validate(ast, config);
	if (errors.length > 0) {
		return {
			frontmatter: frontmatter as FrontmatterSchema,
			error: errors.map((object) => beautifyError(object.error)).join("\n"),
		};
	}

	const content = Markdoc.transform(ast, {
		// passing the frontmatter to variables
		// see https://markdoc.dev/docs/frontmatter#parse-the-frontmatter
		variables: {
			frontmatter,
		},
		...config,
	});
	const html = await renderMarkdownToString(content, {
		components,
	});
	return {
		frontmatter: frontmatter as FrontmatterSchema,
		html,
	};
}

/**
 * Beautifies a Markdoc error.
 *
 * A Marcdoc ValidationError returns an object. Logging
 * the object to the console is not very helpful. This
 * function returns a string that is easier to read.
 */
function beautifyError(error: ValidationError): string {
	// for now, simply stringify the error
	// TODO:
	// - add information about the name and path of the document
	// - add information about the line and column of the error
	return JSON.stringify(error, null, 4);
}
