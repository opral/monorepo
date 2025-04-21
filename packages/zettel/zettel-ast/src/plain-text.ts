import { generateKey } from "./index.js";
import type { ZettelTextBlock, ZettelDoc } from "./schema.js";

/**
 * Serializes the Zettel AST to text.
 *
 * Useful for debugging and testing, or where you can only display text.
 *
 * !Note that this function is lossy and will not preserve all information in the AST.
 *
 * Parsing from text is not possible given the lossy nature of the format.
 */
export function toPlainText(ast: ZettelDoc): string {
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

/**
 * Parses plain text into a ZettelDoc AST.
 * Each line becomes a zettel.textBlock; each block contains a single zettel.span with the text.
 */
export function fromPlainText(text: string): ZettelDoc {
	if (!text) return [];
	return text.split(/\r?\n/).map((line) => {
		return {
			_type: "zettel.textBlock",
			_key: generateKey(),
			style: "zettel.normal",
			markDefs: [],
			children: [
				{
					_type: "zettel.span",
					_key: generateKey(),
					text: line,
					marks: [],
				},
			],
		};
	});
}
