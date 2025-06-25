import { TextNode, SerializedTextNode, NodeKey } from "lexical";
import { generateKey, ZettelSpan } from "@opral/zettel-ast";
import { singleNodeToHtmlElement } from "@opral/zettel-html";

export function $createZettelSpanNode(
  node: Partial<ZettelSpan>,
): ZettelSpanNode {
  return new ZettelSpanNode(node);
}

export interface SerializedZettelSpanNode extends SerializedTextNode {
  zettel: ZettelSpan;
}

export class ZettelSpanNode extends TextNode {
  zettel_key: ZettelSpan["zettel_key"];

  constructor(args: Partial<ZettelSpan>, lexicalKey?: NodeKey) {
    super(args.text ?? "", lexicalKey);
    this.zettel_key = args.zettel_key ?? generateKey();
  }

  static getType(): string {
    return "zettel_span";
  }

  static clone(node: ZettelSpanNode): ZettelSpanNode {
    return new ZettelSpanNode(
      { zettel_key: node.zettel_key, text: node.__text },
      node.__key,
    );
  }

  static override importJSON(node: ZettelSpan): ZettelSpanNode {
    return new ZettelSpanNode(node);
  }

  // @ts-expect-error - "version" is not part of the schema
  exportJSON(): ZettelSpan {
    return {
      type: "zettel_span",
      zettel_key: this.zettel_key,
      text: this.getTextContent(),
      marks: [],
    };
  }

  createDOM(): HTMLElement {
    return singleNodeToHtmlElement(this.exportJSON());
  }
}
