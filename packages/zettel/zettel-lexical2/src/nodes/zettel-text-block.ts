import { ParagraphNode, SerializedParagraphNode } from "lexical";
import { ZettelTextBlock } from "../schema.js";

export interface SerializedZettelTextBlockNode extends SerializedParagraphNode {
  _type: "zettel_text_block";
  _key: ZettelTextBlock["_key"];
}

export class ZettelTextBlockNode extends ParagraphNode {
  // _key: ZettelTextBlock["_key"];

  // constructor(args: { _key: string }) {
  //   super();
  //   this._key = args._key;
  // }

  static clone(node: ZettelTextBlockNode): ZettelTextBlockNode {
    return new ZettelTextBlockNode(node.__key);
  }

  static getType(): string {
    return "zettel_text_block";
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
