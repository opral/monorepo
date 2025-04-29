import { NodeKey, ParagraphNode } from "lexical";
import { ZettelTextBlock } from "@opral/zettel-ast";
import { generateKey } from "@opral/zettel-ast";
import { singleNodeToHtmlElement } from "@opral/zettel-html";

export function $createZettelTextBlockNode(
  node: Partial<ZettelTextBlock>,
): ZettelTextBlockNode {
  return new ZettelTextBlockNode(node);
}

export class ZettelTextBlockNode extends ParagraphNode {
  private zettel_key: ZettelTextBlock["zettel_key"];

  constructor(args: Partial<ZettelTextBlock>, lexicalKey?: NodeKey) {
    super(lexicalKey);
    this.zettel_key = args.zettel_key ?? generateKey();
  }

  static clone(node: ZettelTextBlockNode): ZettelTextBlockNode {
    return new ZettelTextBlockNode({ zettel_key: node.zettel_key }, node.__key);
  }

  static getType(): string {
    return "zettel_text_block";
  }

  static importJSON(node: ZettelTextBlock): ZettelTextBlockNode {
    return new ZettelTextBlockNode({ zettel_key: node.zettel_key });
  }

  // @ts-expect-error - "version" is not part of the schema
  exportJSON(): ZettelTextBlock {
    return {
      type: "zettel_text_block",
      zettel_key: this.zettel_key,
      style: "zettel_normal",
      children: [],
    };
  }

  createDOM(): HTMLElement {
    return singleNodeToHtmlElement(this.exportJSON());
  }
}
