import { NodeKey, ParagraphNode, SerializedParagraphNode } from "lexical";
import { ZettelTextBlock } from "../schema.js";
import { generateKey } from "@opral/zettel-ast";

export interface SerializedZettelTextBlockNode extends SerializedParagraphNode {
  zettel: Omit<ZettelTextBlock, "children" | "_type">;
}

export class ZettelTextBlockNode extends ParagraphNode {
  __zettel_key: ZettelTextBlock["_key"];

  constructor(args: { _key?: string }, lexicalKey?: NodeKey) {
    super(lexicalKey);
    this.__zettel_key = args._key ?? generateKey();
  }

  static clone(node: ZettelTextBlockNode): ZettelTextBlockNode {
    return new ZettelTextBlockNode({ _key: node.__zettel_key }, node.__key);
  }

  static getType(): string {
    return "zettel_text_block";
  }

  static importJSON(
    serializedNode: SerializedZettelTextBlockNode,
  ): ZettelTextBlockNode {
    return new ZettelTextBlockNode({
      _key: serializedNode.zettel._key,
    });
  }

  exportJSON(): SerializedZettelTextBlockNode {
    return {
      ...super.exportJSON(),
      zettel: {
        _key: this.__zettel_key,
        style: "zettel_normal",
      },
    };
  }

  // createDOM(config) {
  //   const dom = super.createDOM(config);
  //   return dom;
  // }

  // static importJSON(
  //   _serializedNode: SerializedZettelTextBlockNode,
  // ): ZettelTextBlockNode {
  //   return new ZettelTextBlockNode({ _key: _serializedNode._key });
  // }

  // exportJSON(): SerializedZettelTextBlockNode {
  //   return {
  //     ...super.exportJSON(),
  //     _key: this._key,
  //     _type: "zettel_text_block",
  //     children: [],
  //   };
  // }
}
