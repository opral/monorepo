import { TextNode, NodeKey } from "lexical";
import type { ZettelSpan } from "../schema.js";

export class ZettelSpanNode extends TextNode {
  static getType(): string {
    return "zettel_span";
  }

  static clone(node: ZettelSpanNode): ZettelSpanNode {
    return new ZettelSpanNode(node.__text, node.__key);
  }

  // constructor(args: { _key: ZettelSpan["_key"]; text: ZettelSpan["text"] }) {
  //   super(args.text, args._key as NodeKey);
  // }

  // static importJSON(serialized: ZettelSpan): ZettelSpanNode {
  //   return new ZettelSpanNode({ _key: serialized._key, text: serialized.text });
  // }

  // exportJSON(): ZettelSpan {
  //   return {
  //     _type: "zettel_span",
  //     _key: this.getKey(),
  //     text: this.getTextContent(),
  //     marks: [],
  //   };
  // }
}
