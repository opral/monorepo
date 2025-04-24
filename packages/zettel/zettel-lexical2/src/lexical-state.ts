import type { SerializedEditorState } from "lexical";
import { ZettelDoc, ZettelTextBlock, ZettelSpan } from "./schema.js";
import type { SerializedZettelTextBlockNode } from "./nodes/zettel-text-block.js";
import type { SerializedZettelSpanNode } from "./nodes/zettel-span.js";

export function fromLexicalState(
  serializedState: SerializedEditorState,
): ZettelDoc {
  const root = serializedState.root;
  if (!root || !root.children) {
    return [];
  }
  const zettel: ZettelDoc = [];
  for (const serializedNode of root.children) {
    if (serializedNode.type === "zettel_text_block") {
      const node = serializedNode as SerializedZettelTextBlockNode;
      const block: ZettelTextBlock = {
        _type: "zettel_text_block",
        _key: node.zettel._key,
        style: "zettel_normal",
        children: [],
      };
      for (const child of node.children) {
        if (child.type === "zettel_span") {
          const spanNode = child as SerializedZettelSpanNode;
          const span: ZettelSpan = {
            _type: "zettel_span",
            _key: spanNode.zettel._key,
            text: spanNode.text,
            marks: [],
          };
          block.children.push(span);
        }
      }
      zettel.push(block);
    }
  }
  return zettel;
}
