import { TextNode, SerializedTextNode, NodeKey } from "lexical";
import type { ZettelSpan } from "../schema.js";
import { generateKey } from "@opral/zettel-ast";

export interface SerializedZettelSpanNode extends SerializedTextNode {
  zettel: ZettelSpan;
}

export class ZettelSpanNode extends TextNode {
  __zettel_key: ZettelSpan["_key"];

  constructor(args: Partial<ZettelSpan>, lexicalKey?: NodeKey) {
    super(args.text ?? "", lexicalKey);
    this.__zettel_key = args._key ?? generateKey();
  }

  static getType(): string {
    return "zettel_span";
  }

  static clone(node: ZettelSpanNode): ZettelSpanNode {
    return new ZettelSpanNode(
      { _key: node.__zettel_key, text: node.__text },
      node.__key,
    );
  }

  static override importJSON(
    serializedNode: SerializedZettelSpanNode,
  ): TextNode {
    return new ZettelSpanNode({
      marks: serializedNode.zettel.marks,
      metadata: serializedNode.zettel.metadata,
      text: serializedNode.text,
    });
  }

  exportJSON(): SerializedZettelSpanNode {
    return {
      ...super.exportJSON(),
      zettel: {
        _key: this.__zettel_key,
        _type: "zettel_span",
        text: this.__text,
      },
    };
  }
}
