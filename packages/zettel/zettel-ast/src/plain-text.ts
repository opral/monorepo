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
export function toPlainText(doc: ZettelDoc): string {
	let lines: string[] = [];
	for (const node of doc.content) {
		if (node.type === "zettel_text_block" && Array.isArray((node as any).children)) {
			let line = "";
			for (const span of (node as any).children) {
				if (span.type !== "zettel_span") {
					throw new Error("Serialize to text only supports zettel_span nodes");
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
 * Each line becomes a zettel_text_block; each block contains a single zettel_span with the text.
 */
export function fromPlainText(text: string): ZettelDoc {
	if (!text) return { type: "zettel_doc", content: [] };
	return {
		type: "zettel_doc",
		content: text.split(/\r?\n/).map((line) => {
			return {
				type: "zettel_text_block",
				zettel_key: generateKey(),
				style: "zettel_normal",
				children: [
					{
						type: "zettel_span",
						zettel_key: generateKey(),
						text: line,
						marks: [],
					},
				],
			};
		}),
	};
}
