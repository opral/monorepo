import {
  LexicalNode,
  NodeKey,
  ParagraphNode,
  SerializedParagraphNode,
  SerializedTextNode,
  TextModeType,
  TextNode,
} from "lexical";
import {
  createZettelSpan,
  createZettelTextBlock,
  generateKey,
  ZettelSpan,
  ZettelTextBlock,
} from "@opral/zettel-ast";
import { singleNodeToHtmlElement } from "@opral/zettel-html";

// #region ZettelSpanNode

export interface SerializedZettelSpanNode extends SerializedTextNode {
  zettelKey?: string; // Optional because newly created nodes might not have one initially
  type: "zettel-span";
  zettelNode: ZettelSpan;
}

export class ZettelSpanNode extends TextNode {
  __zettelKey: string | undefined;

  static getType(): string {
    return "zettel-span";
  }

  static clone(node: ZettelSpanNode): ZettelSpanNode {
    return new ZettelSpanNode(node.__text, node.__zettelKey, node.__key);
  }

  constructor(text: string, zettelKey?: string, key?: NodeKey) {
    super(text, key);
    this.__zettelKey = zettelKey;
    this.__type = "zettel-span";
  }

  canMergeWith(node: LexicalNode): boolean {
    // Merge if adjacent ZettelSpanNodes have same format, style, and mode
    if (!(node instanceof ZettelSpanNode)) return false;
    return (
      this.getFormat() === node.getFormat() &&
      this.getStyle() === node.getStyle() &&
      this.getMode() === node.getMode()
    );
  }

  isSimpleText(): boolean {
    return true;
  }

  createDOM() {
    return singleNodeToHtmlElement(this.exportJSON().zettelNode);
  }

  exportJSON(): SerializedZettelSpanNode {
    return {
      ...super.exportJSON(), // Inherit base properties (text, format, style, etc.)
      type: "zettel-span", // Explicitly set the type
      zettelKey: this.__zettelKey,
      zettelNode: createZettelSpan({
        _key: this.__zettelKey,
        text: this.__text,
        marks: (() => {
          // Derive marks from Lexical's format bitmask
          const marks: string[] = [];
          const format = this.getFormat();
          if (format & 1) marks.push("zettel.strong");
          if (format & (1 << 1)) marks.push("zettel.em");
          if (format & (1 << 4)) marks.push("zettel.code");
          return marks;
        })(),
      }),
      version: 1,
    };
  }

  static importJSON(serializedNode: SerializedZettelSpanNode): ZettelSpanNode {
    const node = new ZettelSpanNode(
      serializedNode.text,
      serializedNode.zettelKey,
    );
    // Set base properties from the serialized data
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  splitText(...splitOffsets: number[]): ZettelSpanNode[] {
    const self = this.getWritable();
    const textContent = self.getTextContent();
    const offsets = Array.from(new Set(splitOffsets)).sort((a, b) => a - b);
    const parts: string[] = [];
    const nodes: ZettelSpanNode[] = [];
    let lastOffset = 0;

    // Calculate the text parts based on the split offsets
    for (const offset of offsets) {
      if (offset <= lastOffset || offset >= textContent.length) {
        continue; // Skip invalid or out-of-bounds offsets
      }
      parts.push(textContent.slice(lastOffset, offset));
      lastOffset = offset;
    }
    parts.push(textContent.slice(lastOffset)); // Add the final part

    // Create nodes for each part
    let firstNode: ZettelSpanNode | null = null;
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (part === "") {
        continue; // Skip empty parts
      }

      let textNode: ZettelSpanNode;
      if (i === 0) {
        // Reuse the original node for the first part, updating its content
        textNode = self.setTextContent(part);
        firstNode = textNode;
      } else {
        // Create new ZettelSpanNode instances for subsequent parts
        const newKey = generateKey(); // CRITICAL: New key for the new node
        textNode = $createZettelSpanNode(part, newKey);
        // Copy properties from the original node, converting mode
        textNode.setFormat(self.__format);
        textNode.setDetail(self.__detail);
        textNode.setStyle(self.__style);
        // Map internal numeric mode to TextModeType string
        const modeMap: { [key: number]: TextModeType } = {
          0: "normal",
          1: "token",
          2: "segmented",
          3: "normal",
        };
        textNode.setMode(modeMap[self.__mode] || "normal");
      }
      nodes.push(textNode);
    }

    if (nodes.length === 0) {
      // If splitting resulted in no non-empty parts (e.g., splitting an empty node)
      // Remove the original node as it's now effectively empty
      self.remove();
      return [];
    }

    // Link the new nodes together in the editor state
    if (firstNode) {
      // Should always be true if nodes.length > 0
      let currentNode = firstNode;
      for (let i = 1; i < nodes.length; i++) {
        const nextNode = nodes[i];
        currentNode.insertAfter(nextNode); // Insert the new node after the previous one
        currentNode = nextNode;
      }
    } else {
      console.error(
        "[ZettelSpanNode] splitText logic error: firstNode is null despite having parts.",
      );
      // Fallback: return original node array to prevent crash, though state might be incorrect
      return [self];
    }

    return nodes; // Return all resulting nodes (original modified + new ones)
  }
}

// #endregion

// --- Custom Zettel Text Block Node ---

export interface SerializedZettelTextBlockNode extends SerializedParagraphNode {
  zettelKey?: string;
  zettelNode: ZettelTextBlock;
  type: "zettel-text-block";
}

export class ZettelTextBlockNode extends ParagraphNode {
  __zettelKey: string;

  static getType(): string {
    return "zettel-text-block";
  }

  static clone(node: ZettelTextBlockNode): ZettelTextBlockNode {
    return new ZettelTextBlockNode(node.__zettelKey, node.__key);
  }

  constructor(zettelKey?: string, key?: NodeKey) {
    super(key);
    this.__zettelKey = zettelKey ?? generateKey();
  }

  exportJSON(): SerializedZettelTextBlockNode {
    return {
      ...super.exportJSON(),
      type: "zettel-text-block",
      zettelKey: this.__zettelKey,
      zettelNode: createZettelTextBlock({
        _key: this.__zettelKey,
        children: [],
        markDefs: [],
      }),
      version: 1,
    };
  }

  static importJSON(
    serializedNode: SerializedZettelTextBlockNode,
  ): ZettelTextBlockNode {
    const node = new ZettelTextBlockNode(serializedNode.zettelKey);
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    return node;
  }

  createDOM() {
    return singleNodeToHtmlElement(this.exportJSON().zettelNode);
  }
}

export function $createZettelSpanNode(
  text: string,
  zettelKey?: string,
): ZettelSpanNode {
  return new ZettelSpanNode(text, zettelKey);
}

export function $isZettelSpanNode(
  node: LexicalNode | null | undefined,
): node is ZettelSpanNode {
  return node instanceof ZettelSpanNode;
}

export function $createZettelTextBlockNode(
  zettelKey?: string,
): ZettelTextBlockNode {
  return new ZettelTextBlockNode(zettelKey);
}

export function $isZettelTextBlockNode(
  node: LexicalNode | null | undefined,
): node is ZettelTextBlockNode {
  return node instanceof ZettelTextBlockNode;
}

export const ZettelNodes = [
  ZettelTextBlockNode,
  ZettelSpanNode,
  {
    replace: ParagraphNode,
    with: () => new ZettelTextBlockNode(),
    withKlass: ZettelTextBlockNode,
  },
  {
    replace: TextNode,
    with: () => new ZettelSpanNode(""),
    withKlass: ZettelSpanNode,
  },
] as const;
