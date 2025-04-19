import type { Span, Zettel } from "./schema.js";

/**
 * Serializes the Zettel AST to text.
 *
 * Useful for debugging and testing, or where you can only display text.
 * Note that this function is lossy and will not preserve all information in the AST.
 *
 * Parsing from text is not possible given the lossy nature of the format.
 */
export function serializeToText(value: Zettel): string {
	return value
		.filter((block) => block._type === "block" && Array.isArray(block.children))
		.map((block) =>
			block.children
				.filter((child): child is Span => child._type === "span" && typeof child.text === "string")
				.map((span) => span.text)
				.join("")
		)
		.join("\n");
}
