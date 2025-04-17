import type { PapierAst, Span, AccountMentionMarkDef } from "./schema.js";

/**
 * Serializes the Papier AST to text.
 *
 * Useful for debugging and testing, or where you can only display text.
 * Note that this function is lossy and will not preserve all information in the AST.
 *
 * Parsing from text is not possible given the lossy nature of the format.
 */
export function serializeToText(value: PapierAst): string {
	return value
		.filter((block) => block._type === "block" && Array.isArray(block.children))
		.map((block) =>
			block.children
				.filter((child): child is Span => child._type === "span" && typeof child.text === "string")
				.map((span) => {
					// Check if the span has marks and the block has markDefs
					if (span.marks && span.marks.length > 0 && block.markDefs) {
						const markKey = span.marks[0]; // Assuming the first mark dictates serialization for now
						const markDef = block.markDefs.find((m) => m._key === markKey);

						// If it's an accountMention mark, use the @Name format
						if (markDef && markDef._type === "accountMention") {
							// Type assertion to access the name property safely
							return `@${(markDef as AccountMentionMarkDef).name}`;
						}
					}
					// Otherwise, use the span's text content
					return span.text;
				})
				.join("")
		)
		.join("\n");
}
