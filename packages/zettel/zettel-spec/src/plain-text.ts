import { generateKey } from "./index.js";
import type { ZettelDoc } from "./nodes/doc.js";
import type { ZettelParagraph } from "./nodes/paragraph.js";
import type { Text } from "./nodes/text.js";

/**
 * Serializes the Tiptap document JSON to plain text.
 *
 * Extracts text content primarily from paragraph nodes.
 * This is lossy and ignores formatting, marks, and non-text nodes.
 *
 * @param doc - The Tiptap document represented as JSON.
 * @returns A plain text string representation.
 */
export function toPlainText(doc: ZettelDoc): string {
	// Handle empty or invalid input
	if (!doc || !doc.content || !Array.isArray(doc.content)) {
		return "";
	}

	let lines: string[] = [];

	// Iterate through the top-level nodes in the document
	for (const node of doc.content) {
		// Check if the node is a paragraph (adjust type name if necessary)
		if (node.type === "zettel_paragraph") {
			let currentLine = "";
			// Check if the paragraph has inline content
			if (node.content && Array.isArray(node.content)) {
				// Iterate through the inline nodes (text, mentions, etc.) within the paragraph
				for (const inlineNode of node.content) {
					// If it's a text node, append its text
					if (inlineNode.type === "text" && typeof (inlineNode as Text).text === "string") {
						currentLine += (inlineNode as Text).text;
					}
					// --- Optional: Handle other inline nodes ---
					// else if (inlineNode.type === 'mention' && inlineNode.attrs?.displayText) {
					//    currentLine += inlineNode.attrs.displayText;
					// }
				}
			}
			// Add the extracted line from the paragraph to our list
			lines.push(currentLine);
		}
	}

	// Join all collected lines with newline characters
	return lines.join("\n");
}

/**
 * Parses plain text into a ZettelDoc AST (Tiptap JSON format).
 * Each line becomes a zettel_paragraph node containing a single text node.
 *
 * @param text - The plain text string to parse.
 * @returns A ZettelDoc object representing the Tiptap JSON structure.
 */
export function fromPlainText(text: string): ZettelDoc {
	// Handle null/undefined/empty string input - return an empty doc
	if (!text) {
		return {
			type: "zettel_doc",
			content: [],
		};
	}

	// Split the input text into lines based on newline characters
	const lines = text.split(/\r?\n/);

	// Map each line to a zettel_paragraph node
	const paragraphNodes: ZettelParagraph[] = lines.map((line) => {
		// Create the content for the paragraph: a single text node
		const textNode: Text = { type: "text", text: line };
		const paragraphContent: Text[] = [];

		// Only add the text node if the line is not empty.
		// If the line is empty, the paragraph will have no content.
		if (line) {
			paragraphContent.push(textNode);
		}

		const paragraphNode: ZettelParagraph = {
			type: "zettel_paragraph",
			attrs: { zettel_key: generateKey() },
			content: paragraphContent,
		};
		return paragraphNode;
	});

	const doc: ZettelDoc = {
		type: "zettel_doc",
		content: paragraphNodes,
	};

	return doc;
}
