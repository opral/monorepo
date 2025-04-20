// src/conversion.ts

import type {
  EditorState,
  SerializedTextNode,
  SerializedParagraphNode,
  SerializedRootNode,
} from "lexical";

// Define the target Zettel AST structure types
export interface ZettelSpan {
  type: "span";
  text: string;
  marks: string[]; // e.g., ['bold', 'italic']
}

export interface ZettelBlock {
  type: "block";
  children: ZettelSpan[];
}

// Helper to check bitmask - Checks if a specific bit is set in the format number
const hasFormat = (format: number, type: number): boolean =>
  (format & type) !== 0;

/**
 * Converts a Lexical TextNode's format bitmask into a Zettel marks array.
 */
function convertFormatToMarks(format: number): string[] {
  const marks: string[] = [];
  // Check for specific format bits and add corresponding marks
  if (hasFormat(format, 1)) { // 1 corresponds to FORMAT_BOLD in Lexical constants
    marks.push("bold");
  }
  if (hasFormat(format, 2)) { // 2 corresponds to FORMAT_ITALIC
    marks.push("italic");
  }
  // Add checks for other formats if needed (underline, strikethrough, etc.)
  // if (hasFormat(format, 8)) { marks.push('underline'); }
  return marks;
}

/**
 * Converts a Lexical EditorState JSON object into a Zettel AST.
 * Currently handles simple structures: Root -> Paragraph -> Text.
 */
export function exportZettelAST(
  editorStateJSON: ReturnType<EditorState["toJSON"]>,
): ZettelBlock[] {
  const zettelBlocks: ZettelBlock[] = [];
  // Type cast the root to SerializedRootNode
  const lexicalRoot = editorStateJSON.root as SerializedRootNode;

  // Check if root and its children exist
  if (!lexicalRoot?.children) {
    return zettelBlocks;
  }

  // Iterate through the children of the Lexical RootNode
  for (const topLevelNode of lexicalRoot.children) {
    // Type guard to ensure it's a paragraph and has children
    if (topLevelNode.type === "paragraph" && "children" in topLevelNode) {
      const paragraphNode = topLevelNode as SerializedParagraphNode; // Cast after check
      const zettelBlock: ZettelBlock = {
        type: "block",
        children: [],
      };

      // Iterate through the children of the ParagraphNode (expecting TextNodes)
      for (const childNode of paragraphNode.children) {
        // Check if it's a text node
        if (childNode.type === "text") {
          const textNode = childNode as SerializedTextNode; // Cast to SerializedTextNode
          const zettelSpan: ZettelSpan = {
            type: "span",
            text: textNode.text,
            marks: convertFormatToMarks(textNode.format ?? 0),
          };
          zettelBlock.children.push(zettelSpan);
        }
        // Add handling for other potential node types within a paragraph if needed
      }
      zettelBlocks.push(zettelBlock);
    }
    // Add handling for other top-level node types (e.g., lists, headings) if needed
  }

  return zettelBlocks;
}
