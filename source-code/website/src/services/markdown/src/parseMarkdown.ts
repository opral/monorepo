import Markdoc, { type ValidationError } from "@markdoc/markdoc"
import type { TSchema } from "@sinclair/typebox"
import { Value } from "@sinclair/typebox/value"
import { parse as parseYaml } from "yaml"
import { config } from "./config.js"

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
export function parseMarkdown<FrontmatterSchema extends TSchema>(args: {
	text: string
	frontmatterSchema: FrontmatterSchema
}): {
	frontmatter: FrontmatterSchema
	renderableTree?: Markdoc.RenderableTreeNode
	error?: string
} {
	const ast = Markdoc.parse(args.text)
	const frontmatter = parseYaml(ast.attributes.frontmatter ?? "")
	if (Value.Check(args.frontmatterSchema, frontmatter) === false) {
		const errors = [...Value.Errors(args.frontmatterSchema, frontmatter)]
		throw Error(`Invalid frontmatter for ${args.text.slice(0, 100)}...` + errors.map(beautifyError))
	}
	const errors = Markdoc.validate(ast, config)
	if (errors.length > 0) {
		return {
			frontmatter: frontmatter,
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
		frontmatter: frontmatter,
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
function beautifyError(error: object): string {
	// for now, simply stringify the error
	// TODO:
	// - add information about the name and path of the document
	// - add information about the line and column of the error
	return JSON.stringify(error, undefined, 4)
}
