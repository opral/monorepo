import { ParagraphNode, TextNode } from "lexical";
import { ZettelSpanNode } from "./zettel-span.js";
import { ZettelTextBlockNode } from "./zettel-text-block.js";

export { ZettelSpanNode, ZettelTextBlockNode };

export const ZettelNodes = [
  ZettelTextBlockNode,
  ZettelSpanNode,
  {
    replace: ParagraphNode,
    with: () => new ZettelTextBlockNode({}),
    withKlass: ZettelTextBlockNode,
  },
  {
    replace: TextNode,
    with: () => new ZettelSpanNode({}),
    withKlass: ZettelSpanNode,
  },
] as const;
