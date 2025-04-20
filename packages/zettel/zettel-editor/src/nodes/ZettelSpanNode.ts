import {
  EditorConfig,
  LexicalNode,
  TextNode,
  SerializedTextNode,
  Spread,
  $applyNodeReplacement,
  TextFormatType, // Import TextFormatType
} from "lexical";
import { generateKey } from "@opral/zettel-ast"; // Import key generation

// Define the serialized format expected by Lexical, extending SerializedTextNode
export type SerializedZettelSpanNode = Spread<
  {
    type: "zettel-span"; // Needs a unique type for Lexical registration
    version: 1;
    zettelKey: string; // Custom property
    marks: string[]; // Custom property
  },
  SerializedTextNode
>;

export class ZettelSpanNode extends TextNode {
  // Store Zettel key separately from Lexical's internal key
  __marks: string[];
  __zettelKey: string;

  static getType(): string {
    // Use a unique type for Lexical registration
    return "zettel-span";
  }

  static clone(node: ZettelSpanNode): ZettelSpanNode {
    // Let Lexical generate a new key on clone, but preserve our data
    // Pass the existing key from the node being cloned to preserve it
    console.log(`[ZettelSpanNode static clone] Cloning node: ${node.__key}`);
    return new ZettelSpanNode(node.__text, node.__marks, node.__zettelKey);
  }

  // Constructor: Accept text, zettelKey, and marks
  constructor(text: string, marks: string[] = [], zettelKey: string) {
    super(text);
    this.__marks = [...marks];
    this.__zettelKey = zettelKey;
  }

  createDOM(config: EditorConfig): HTMLElement {
    console.log(`[ZettelSpanNode createDOM] For node: ${this.__key}`);
    const dom = super.createDOM(config);
    // Use data-zettel-key to store our key, data-key might conflict
    dom.setAttribute("data-zettel-key", this.__zettelKey);
    // Apply initial styles based on formats
    if (this.__marks.includes("italic")) {
      dom.style.fontStyle = "italic";
    }
    // Add other styles or attributes based on __marks if needed later
    return dom;
  }

  updateDOM(
    prevNode: TextNode, // Align with superclass parameter type expectation
    dom: HTMLElement,
    config: EditorConfig,
  ): boolean {
    console.log(`[ZettelSpanNode updateDOM] For node: ${this.__key}`);
    // Cast prevNode to 'this' type expected by super.updateDOM
    const isUpdated = super.updateDOM(prevNode as this, dom, config);

    // Update italic style if the format changed
    const prevHasItalic = (prevNode as ZettelSpanNode).__marks?.includes(
      "italic",
    );
    const currHasItalic = this.__marks.includes("italic");

    if (prevHasItalic !== currHasItalic) {
      dom.style.fontStyle = currHasItalic ? "italic" : "normal";
      // isUpdated = true; // No need to set true, style change doesn't require full re-render usually
    }

    // Update zettelKey if it changed (should be rare)
    if ((prevNode as ZettelSpanNode).__zettelKey !== this.__zettelKey) {
      dom.setAttribute("data-zettel-key", this.__zettelKey);
    }
    return isUpdated;
  }

  // // Override splitText to ensure new nodes are ZettelSpanNodes with unique keys
  // splitText(...splitOffsets: number[]): ZettelSpanNode[] {
  //   console.log(
  //     `[ZettelSpanNode splitText] Splitting node: ${this.__key} ("${this.__text}") at offsets: ${splitOffsets}`,
  //   );
  //   const self = this.getWritable();

  //   // Use the base TextNode's splitText logic first
  //   const basicTextNodes = super.splitText(...splitOffsets);
  //   console.log(
  //     `[ZettelSpanNode splitText] Original node mutated to: ${self.__key} ("${self.__text}"), format: ${self.getFormat()}`,
  //   );
  //   const subsequentZettelNodes: ZettelSpanNode[] = [];

  //   // The original node 'self' is mutated by super.splitText() to be the first segment.
  //   // The returned array 'basicTextNodes' contains the *subsequent* segments.

  //   // Convert the subsequent TextNode segments into ZettelSpanNodes
  //   for (const basicNode of basicTextNodes) {
  //     const newZettelKey = generateKey(); // Generate a *new* key for the split part
  //     const textContent = basicNode.getTextContent();
  //     console.log(
  //       `[ZettelSpanNode splitText] Processing segment: "${textContent}", new zettelKey: ${newZettelKey}`,
  //     );

  //     // *** Use the creator function instead of constructor ***
  //     // This calls $applyNodeReplacement internally
  //     const newZettelSpanNode = ZettelSpanNode.$createZettelSpanNode(
  //       textContent,
  //       self.__marks, // Copy marks from original
  //       newZettelKey,
  //     );
  //     // Copy format, style, detail, mode from the TextNode created by super.splitText()
  //     // as $create... might not preserve them automatically
  //     newZettelSpanNode.setFormat(basicNode.getFormat()); // Copy format from base split
  //     newZettelSpanNode.setStyle(basicNode.getStyle());
  //     newZettelSpanNode.setDetail(basicNode.getDetail());
  //     newZettelSpanNode.setMode(basicNode.getMode());

  //     subsequentZettelNodes.push(newZettelSpanNode); // Add to our return array
  //     console.log(
  //       `[ZettelSpanNode splitText] Created subsequent node VIA $create: ${newZettelSpanNode.__key}` // Modified log
  //     );
  //   }

  //   // *** Return the mutated original node PLUS the new subsequent nodes ***
  //   const resultNodes = [self as ZettelSpanNode, ...subsequentZettelNodes];
  //   console.log(
  //     `[ZettelSpanNode splitText] Returning ${resultNodes.length} nodes total (mutated original + new).`
  //   );
  //   return resultNodes;
  // }

  // importJSON needs to accept the SerializedZettelSpanNode type
  static importJSON(serializedNode: SerializedZettelSpanNode): ZettelSpanNode {
    // Create node using data from the serialized format
    // Use the zettelKey from the serialized data
    const node = ZettelSpanNode.$createZettelSpanNode(
      serializedNode.text,
      serializedNode.marks,
      serializedNode.zettelKey,
    );
    // Ensure base properties from SerializedTextNode are also set
    node.setFormat(serializedNode.format);
    node.setDetail(serializedNode.detail);
    node.setMode(serializedNode.mode);
    node.setStyle(serializedNode.style);
    return node;
  }

  // exportJSON must return a format compatible with Lexical's expectations
  exportJSON(): SerializedZettelSpanNode {
    // Start with base properties and add/override our custom ones
    const baseSerialized = super.exportJSON();

    // Synchronize the marks array with the current format state for export
    // Create a mutable copy of the stored marks
    const currentMarks = [...this.__marks]; // Get stored marks
    const hasItalicFormat = this.hasFormat("italic");
    const hasItalicMark = currentMarks.includes("italic");
    const exportMarks = [...currentMarks]; // Create mutable copy for export

    console.log(
      `[ZettelSpanNode exportJSON] Node: ${this.__key} ("${this.__text}"), zettelKey: ${this.__zettelKey}, hasItalicFormat: ${hasItalicFormat}, initialMarks: ${JSON.stringify(currentMarks)}`,
    );

    if (hasItalicFormat && !hasItalicMark) {
      // Add 'italic' to exported marks if format is set but mark isn't present
      exportMarks.push("italic");
      console.log(`[ZettelSpanNode exportJSON] Added 'italic' to exportMarks.`);
    } else if (!hasItalicFormat && hasItalicMark) {
      // Remove 'italic' from exported marks if format is *not* set but mark *is* present
      const index = exportMarks.indexOf("italic");
      if (index > -1) {
        exportMarks.splice(index, 1);
        console.log(
          `[ZettelSpanNode exportJSON] Removed 'italic' from exportMarks.`,
        );
      }
    }

    // Note: We are *not* modifying this.__marks here, only the exported representation.
    // Lexical manages the __format state internally.

    const finalJSON = {
      ...baseSerialized,
      type: "zettel-span", // Ensure our type is set
      zettelKey: this.__zettelKey,
      marks: exportMarks, // Use the synchronized marks for export
      version: 1, // Ensure version is present
    } as SerializedZettelSpanNode; // Cast to our specific type

    console.log(
      `[ZettelSpanNode exportJSON] Final exported marks: ${JSON.stringify(exportMarks)}, JSON:`,
      finalJSON,
    );
    return finalJSON;
  }

  // Getter for our stored Zettel key
  getZettelKey(): string {
    return this.__zettelKey;
  }

  getMarks(): string[] {
    return [...this.__marks]; // Return a copy to prevent external modification
  }

  // Explicitly state this behaves like simple text for formatting purposes
  isSimpleText(): boolean {
    return true;
  }

  setFormat(format: number): this {
    // Call super to update Lexical's format bitmask
    super.setFormat(format);

    // Sync 'italic' in marks with the Lexical format bitmask
    const hasItalic = (format & 2) !== 0; // 2 is Lexical's bitmask for italic
    const alreadyMarked = this.__marks.includes("italic");

    if (hasItalic && !alreadyMarked) {
      this.__marks.push("italic");
    } else if (!hasItalic && alreadyMarked) {
      this.__marks = this.__marks.filter((m) => m !== "italic");
    }
    return this;
  }

  hasFormat(type: TextFormatType): boolean {
    if (type === "italic") {
      return this.__marks.includes("italic");
    }
    return super.hasFormat(type);
  }

  // Creator function: Don't pass zettelKey as NodeKey
  static $createZettelSpanNode(
    text: string,
    marks: string[] = [],
    zettelKey: string,
  ): ZettelSpanNode {
    // Defensive: Ensure text is not a Lexical node
    if (typeof text !== "string") {
      throw new Error("span.text must be a string, not a Lexical node!");
    }
    // Only pass primitive values, never Lexical nodes!
    // Return the new node directly, letting the constructor handle the key.
    // Pass zettelKey to constructor for storage, Lexical key is handled by $applyNodeReplacement
    return $applyNodeReplacement(new ZettelSpanNode(text, marks, zettelKey));
  }

  // Type guard - check for instance of the Lexical node class
  static $isZettelSpanNode(
    node: LexicalNode | null | undefined,
  ): node is ZettelSpanNode {
    // Should return 'is ZettelSpanNode'
    return node instanceof ZettelSpanNode;
  }
}
