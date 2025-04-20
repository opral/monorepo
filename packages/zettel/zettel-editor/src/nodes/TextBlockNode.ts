import {
  $applyNodeReplacement,
  EditorConfig,
  ElementNode,
  LexicalNode,
  Spread,
} from "lexical";
import { generateKey, ZettelTextBlock } from "@opral/zettel-ast"; // Import key generation and Block type

// Define the type for the serialized state if needed
export type SerializedTextBlockNode = Spread<
  {
    type: "text-block"; // Ensure type is present
    zettelStyle: ZettelTextBlock["style"];
    zettelKey: string; // Add zettelKey to serialized format
    version: 1;
  },
  ReturnType<ElementNode["exportJSON"]>
>;

export class TextBlockNode extends ElementNode {
  __zettelStyle: ZettelTextBlock["style"]; // Use the specific type from the interface
  __zettelKey: string; // Store the Zettel key

  static getType(): string {
    return "text-block";
  }

  static clone(node: TextBlockNode): TextBlockNode {
    // Lexical handles NodeKey, we preserve our data
    return new TextBlockNode(node.__zettelStyle, node.__zettelKey);
  }

  // Constructor: Accept zettelKey
  constructor(zettelStyle?: ZettelTextBlock["style"], zettelKey?: string) {
    super(); // Lexical NodeKey is handled by $applyNodeReplacement
    this.__zettelStyle = zettelStyle ?? "normal";
    // Ensure zettelKey is always a string, generate if missing
    this.__zettelKey = zettelKey ?? generateKey();
  }

  // --- Core Node API ---

  createDOM(_config: EditorConfig): HTMLElement {
    // Create the DOM element, e.g., a <div> or <p>
    // Add classes or styles based on config theme or __zettelStyle
    const element = document.createElement("div"); // Use div for now
    // Example: Add style class if needed
    // if (this.__zettelStyle !== 'normal') {
    //   element.classList.add(this.__zettelStyle);
    // }
    return element;
  }

  updateDOM(
    _prevNode: TextBlockNode,
    _dom: HTMLElement,
    _config: EditorConfig,
  ): boolean {
    // Return true if the DOM node was updated.
    // Update styles/classes if __zettelStyle changes
    // For now, no updates needed based on internal properties
    return false;
  }

  exportJSON(): SerializedTextBlockNode {
    const baseSerialized = super.exportJSON();
    return {
      ...baseSerialized,
      type: "text-block",
      zettelStyle: this.__zettelStyle,
      zettelKey: this.__zettelKey, // Include zettelKey
      version: 1,
    };
  }

  // --- Serialization ---
  static importJSON(serializedNode: SerializedTextBlockNode): TextBlockNode {
    // Use the factory function to create the node with the correct Zettel key and style
    const node = $createTextBlockNode(serializedNode.zettelStyle, serializedNode.zettelKey);

    // Apply standard element properties from the serialized data
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);

    return node;
  }

  // --- Custom Methods ---

  getZettelStyle(): ZettelTextBlock["style"] {
    const self = this.getLatest();
    // Provide a default if the style is undefined
    return self.__zettelStyle;
  }

  setZettelStyle(style: ZettelTextBlock["style"]): void {
    const self = this.getWritable();
    self.__zettelStyle = style;
  }

  // --- Lexical Block Behavior ---
  insertNewAfter(): TextBlockNode {
    // When Enter is pressed, create a new TextBlockNode
    const newBlock = $createTextBlockNode("normal");
    this.insertAfter(newBlock);
    // Keybinding handler will call newBlock.selectStart() to move focus
    return newBlock;
  }

  collapseAtStart(): boolean {
    // Allow merging with the previous block when Backspace/Delete is pressed
    // at the beginning of this block
    return true;
  }

  canBeEmpty(): boolean {
    return true;
  }

  isInline(): boolean {
    return false;
  }
}

// --- Creator Function ---
export function $createTextBlockNode(
  zettelStyle?: ZettelTextBlock["style"],
  zettelKey?: string, // Optional key from AST
): TextBlockNode {
  // Use $applyNodeReplacement for proper registration within the editor state
  // Pass style and optional key (constructor will generate if undefined)
  return $applyNodeReplacement(new TextBlockNode(zettelStyle, zettelKey));
}

// --- Type Guard ---
export function $isTextBlockNode(
  node: LexicalNode | null | undefined,
): node is TextBlockNode {
  return node instanceof TextBlockNode;
}
