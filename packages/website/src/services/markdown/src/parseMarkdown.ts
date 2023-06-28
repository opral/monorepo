import Markdoc, { type ValidationError } from "@markdoc/markdoc"
import { parse as parseYaml } from "yaml"
import { z } from "zod"
import { config } from "./config.js"

/**
 * The frontmatter that is required by the markdown service.
 *
 * `href` the url slug e.g. /documentation/intro
 * `title` the title of the document
 *
 * See https://markdoc.dev/docs/frontmatter
 */
export type RequiredFrontmatter = z.infer<typeof RequiredFrontmatter>
export const RequiredFrontmatter = z.object({
	href: z
		.string({
			description:
				"The href is the path where the markdown is rendered e.g. /documentation/intro and simultaneously acts as id.",
		})
		.startsWith("/"),
	title: z.string(),
	shortTitle: z.string().optional(),
	description: z
		.string({ description: "Description for SEO and prerendering purposes." })
		.min(10)
		.max(160),
})

/**
 * Parses a Markdoc document.
 *
 * Provide the markdown document as a string, the
 * function returns the a renderable tree and
 * the [frontmatter](https://markdoc.dev/docs/frontmatter)
 * if no error occured. If an error occured, renderableTree is undefined.
 *
 * The renderable tree can be passed to `renderToElement`
 *
 * @example
 * 	const renderableTree = parseMarkdown(args)
 * 	const Element = renderToElement(args)
 * 	<Element>
 *
 */
export function parseMarkdown<FrontmatterSchema extends RequiredFrontmatter>(args: {
	text: string
	FrontmatterSchema: typeof RequiredFrontmatter
}): {
	frontmatter: {
		title: string
		shortTitle?: string
		description: string
		href: string
	}
	renderableTree?: Markdoc.RenderableTreeNode
	error?: string
} {
	const ast = Markdoc.parse(args.text)
	const frontmatter = args.FrontmatterSchema.parse(parseYaml(ast.attributes.frontmatter ?? ""))
	const errors = Markdoc.validate(ast, config)
	if (errors.length > 0) {
		return {
			frontmatter: frontmatter as FrontmatterSchema,
			error: errors.map((object) => beautifyError(object.error)).join("\n"),
		}
	}
	const renderableTree = Markdoc.transform(ast, {
		// passing the frontmatter to variables
		// see https://markdoc.dev/docs/frontmatter#parse-the-frontmatter
		variables: {
			frontmatter,
		},
		...config,
	})
	return {
		frontmatter: frontmatter as FrontmatterSchema,
		renderableTree,
	}
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
	return JSON.stringify(error, undefined, 4)
}
