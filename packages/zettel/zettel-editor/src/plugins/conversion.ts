import {
  EditorState,
  LineBreakNode,
  ParagraphNode,
  RootNode,
  TextNode,
} from "lexical";
import { Zettel, ZettelTextBlock } from "@opral/zettel-ast";

// Helper to check bitmask - Checks if a specific bit is set in the format number
const hasFormat = (format: number, type: number): boolean =>
  (format & type) !== 0;

/**
 * Converts a Lexical TextNode's format bitmask into a Zettel marks array.
 */
function convertFormatToMarks(format: number): string[] {
  const marks: string[] = [];
  // Check for specific format bits and add corresponding marks
  if (hasFormat(format, 1)) {
    // 1 corresponds to FORMAT_BOLD in Lexical constants
    marks.push("bold");
  }
  if (hasFormat(format, 2)) {
    // 2 corresponds to FORMAT_ITALIC
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
export function exportZettelAST(editorState: EditorState): Zettel {
  const zettelBlocks: ZettelTextBlock[] = [];

  editorState.read(() => {
    const root = editorState._nodeMap.get("root") as RootNode;
    if (!root) return;

    // Iterate over top-level nodes (typically paragraphs)
    for (const topLevelNode of root.getChildren()) {
      if (topLevelNode instanceof ParagraphNode) {
        let currentBlock: ZettelTextBlock | null = null; // Initialize block

        // Iterate over children of the paragraph (TextNode, LineBreakNode, etc.)
        for (const childNode of topLevelNode.getChildren()) {
          if (childNode instanceof TextNode) {
            // If we don't have a current block, start one
            if (!currentBlock) {
              // Start a new block using the parent Paragraph's key
              currentBlock = {
                _type: "zettel.textBlock",
                _key: topLevelNode.getKey(),
                style: "normal",
                children: [],
                markDefs: [],
              };
            } else if (currentBlock._key !== topLevelNode.getKey()) {
              // Safety check: If parent key changes, start new block (shouldn't happen mid-paragraph)
              currentBlock = {
                _type: "zettel.textBlock",
                _key: topLevelNode.getKey(),
                style: "normal",
                children: [],
                markDefs: [],
              };
            }
            const textNode = childNode;
            const marks = convertFormatToMarks(textNode.getFormat());
            // Add span only if text is not empty
            if (textNode.getTextContent().length > 0) {
              currentBlock.children.push({
                _type: "zettel.span",
                _key: textNode.getKey(), // Use TextNode's key for span
                text: textNode.getTextContent(),
                marks,
              });
            }
          } else if (childNode instanceof LineBreakNode) {
            // If we encounter a line break and have a current block with content, push it.
            if (currentBlock && currentBlock.children.length > 0) {
              zettelBlocks.push(currentBlock);
            }
            // Start a new block for content after the line break
            // Use the parent Paragraph's key for the new block after line break
            currentBlock = {
              _type: "zettel.textBlock",
              _key: topLevelNode.getKey(),
              style: "normal",
              children: [],
              markDefs: [],
            };
          }
          // Handle other node types if necessary
        }

        // After processing all children, push the last block if it has content
        if (currentBlock && currentBlock.children.length > 0) {
          zettelBlocks.push(currentBlock);
        }
      }
      // Handle other top-level node types if necessary
    }
  });

  return zettelBlocks;
}
