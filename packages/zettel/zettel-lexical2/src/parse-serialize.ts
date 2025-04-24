import { SerializedEditorState } from "lexical";
import {
  type ZettelDoc,
  type ZettelSpan,
  type ZettelTextBlock,
} from "@opral/zettel-ast";
import {
  SerializedZettelTextBlockNode,
  SerializedZettelSpanNode,
} from "./nodes.js";

// Define Lexical format constants (ensure these match Lexical's values)
const TEXT_FORMAT_BOLD = 1;
const TEXT_FORMAT_ITALIC = 1 << 1;
const TEXT_FORMAT_STRIKETHROUGH = 1 << 2;
const TEXT_FORMAT_UNDERLINE = 1 << 3;
const TEXT_FORMAT_CODE = 1 << 4;
// Add others as needed (e.g., subscript, superscript, highlight)

/**
 *
 */
export function fromLexicalState(
  serializedState: SerializedEditorState,
): ZettelDoc {
  const zettel: ZettelDoc = [];
  const root = serializedState.root;

  if (!root || !root.children) {
    return zettel; // Return empty if root or children are missing
  }

  for (const serializedNode of root.children) {
    // Check the type string to identify Zettel Text Blocks
    if (serializedNode.type === "zettel-text-block") {
      // Cast to the specific serialized type
      const blockNode = serializedNode as SerializedZettelTextBlockNode;

      const zettelBlock: ZettelTextBlock = {
        _type: "zettel.textBlock",
        // Use the key from the serialized node, fallback to empty string
        _key: blockNode.zettelKey ?? "",
        style: "zettel.normal", // TODO: Derive style if stored in blockNode
        children: [],
        markDefs: [], // Should be an array, not an object
      };

      if (blockNode.children) {
        for (const childNode of blockNode.children) {
          // Check the type string for Zettel Spans
          if (childNode.type === "zettel-span") {
            // Cast to the specific serialized type
            const spanNode = childNode as SerializedZettelSpanNode;
            const marks: string[] = [];
            const formatBitmask = spanNode.format; // Get the format number

            // Map Lexical format bitmask TO Zettel marks
            if (formatBitmask & TEXT_FORMAT_BOLD) marks.push("zettel.strong");
            if (formatBitmask & TEXT_FORMAT_ITALIC) marks.push("zettel.em");
            if (formatBitmask & TEXT_FORMAT_UNDERLINE)
              marks.push("zettel.underline");
            if (formatBitmask & TEXT_FORMAT_STRIKETHROUGH)
              marks.push("zettel.delete");
            if (formatBitmask & TEXT_FORMAT_CODE) marks.push("zettel.code");
            // TODO: Add checks for other formats based on constants
            // TODO: How to handle custom marks? They aren't in the format bitmask.

            const zettelSpan: ZettelSpan = {
              _type: "zettel.span",
              // Use the key from the serialized node, fallback to empty string
              _key: spanNode.zettelKey ?? "",
              text: spanNode.text,
              marks: marks,
            };
            zettelBlock.children.push(zettelSpan);
          }
          // Handle other potential child node types (e.g., generic SerializedTextNode)
          // if they can exist within a SerializedZettelTextBlockNode
        }
      }
      zettel.push(zettelBlock);
    }
    // Handle other top-level node types if necessary
  }

  return zettel;
}

/**
 * Serializes a Zettel Doc into a Lexical SerializedEditorState JSON structure.
 */
export function toLexicalState(doc: ZettelDoc): SerializedEditorState {
  const lexicalBlocks: SerializedZettelTextBlockNode[] = []; // Use specific type

  // Type guard for ZettelTextBlock
  function isZettelTextBlock(block: any): block is ZettelTextBlock {
    return (
      block &&
      block._type === "zettel.textBlock" &&
      Array.isArray(block.children)
    );
  }

  for (const zettelBlock of doc) {
    if (isZettelTextBlock(zettelBlock)) {
      const lexicalSpans: SerializedZettelSpanNode[] = [];
      for (const zettelSpan of zettelBlock.children) {
        if (zettelSpan._type === "zettel.span") {
          let formatBitmask = 0;
          // Map Zettel marks back FROM Zettel marks TO Lexical format bitmask
          if (zettelSpan.marks) {
            for (const mark of zettelSpan.marks) {
              switch (mark) {
                case "zettel.strong":
                  formatBitmask |= TEXT_FORMAT_BOLD;
                  break;
                case "zettel.em":
                  formatBitmask |= TEXT_FORMAT_ITALIC;
                  break;
                case "zettel.underline":
                  formatBitmask |= TEXT_FORMAT_UNDERLINE;
                  break;
                case "zettel.delete":
                  formatBitmask |= TEXT_FORMAT_STRIKETHROUGH;
                  break;
                case "zettel.code":
                  formatBitmask |= TEXT_FORMAT_CODE;
                  break;
                // Add cases for other mappable marks
                // Custom marks won't map to format unless you define bits
              }
            }
          }

          const lexicalSpan: SerializedZettelSpanNode = {
            type: "zettel-span", // From ZettelSpanNode.exportJSON
            version: 1,
            zettelKey: zettelSpan._key,
            text: zettelSpan.text,
            format: formatBitmask,
            style: "", // Default from SerializedTextNode
            mode: "normal", // Default from SerializedTextNode
            detail: 0, // Default from SerializedTextNode
            zettelNode: zettelSpan,
          };
          lexicalSpans.push(lexicalSpan);
        }
      }
      const lexicalBlock: SerializedZettelTextBlockNode = {
        type: "zettel-text-block", // From ZettelTextBlockNode.exportJSON
        version: 1,
        zettelKey: zettelBlock._key,
        children: lexicalSpans,
        direction: null, // Default from SerializedElementNode
        format: "", // Default from SerializedElementNode
        indent: 0, // Default from SerializedElementNode
        textFormat: 0, // Correct type: number
        textStyle: "", // Add missing required property
        zettelNode: zettelBlock,
        // style: "", // Add if ZettelTextBlock has own style property in exportJSON
      };
      lexicalBlocks.push(lexicalBlock);
    }
    // Handle other Zettel block types if necessary
  }

  const serializedState: SerializedEditorState = {
    root: {
      type: "root",
      version: 1,
      children: lexicalBlocks,
      direction: null,
      format: "",
      indent: 0,
    },
  };

  return serializedState;
}
