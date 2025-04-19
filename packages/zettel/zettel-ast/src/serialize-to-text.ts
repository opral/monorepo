import type { ZettelTextBlock, Zettel } from "./schema.js";

/**
 * Serializes the Zettel AST to text.
 *
 * Useful for debugging and testing, or where you can only display text.
 * Note that this function is lossy and will not preserve all information in the AST.
 *
 * Parsing from text is not possible given the lossy nature of the format.
 */
export function serializeToText(ast: Zettel): string {
	let lines: string[] = [];
	for (const node of ast) {
		if (node._type === "zettel.textBlock") {
			let line = "";
			for (const span of (node as ZettelTextBlock).children) {
				if (span._type !== "zettel.span") {
					throw new Error("Serialize to text only supports zettel.span nodes");
				}
				line += `${span.text}`;
			}
			lines.push(line);
		}
	}

	return lines.join("\n");
}
