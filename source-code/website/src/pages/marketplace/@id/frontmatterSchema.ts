import { Type } from "@sinclair/typebox"

/**
 * The frontmatter that is required by the markdown service.
 *
 * `href` the url slug e.g. /documentation/intro
 * `title` the title of the document
 *
 * See https://markdoc.dev/docs/frontmatter
 */
export type MarketplaceFrontmatterSchema = typeof MarketplaceFrontmatterSchema
export const MarketplaceFrontmatterSchema = Type.Object({
	href: Type.String({
		description:
			"The href is the path where the markdown is rendered e.g. /documentation/intro and simultaneously acts as id.",
		pattern: "^/.*",
	}),
	title: Type.String(),
	description: Type.String({
		description: "Description for SEO and prerendering purposes.",
		minLength: 10,
		maxLength: 160,
	}),
})
