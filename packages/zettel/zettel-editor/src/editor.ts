import { LitElement, html, css, PropertyValues } from "lit";
import { customElement, property } from "lit/decorators.js";
import { Zettel, ZettelTextBlock, ZettelSpan } from "@opral/zettel-ast";
import {
  LexicalEditor,
  createEditor,
  EditorState,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  FORMAT_TEXT_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
} from "lexical";
import { registerKeybindings } from "./keybindings.js";
import { registerCommandHandlers } from "./commands.js";
import {
  TextBlockNode,
  $createTextBlockNode,
  $isTextBlockNode,
} from "./nodes/TextBlockNode.js";
import { ZettelSpanNode } from "./nodes/ZettelSpanNode.js";
import { generateKey } from "@opral/zettel-ast";

export type EditorProps = {
  zettel: Zettel;
};

@customElement("zettel-editor")
export class ZettelEditor extends LitElement {
  static styles = css`
    :host {
      display: block;
      border: 1px solid #ccc;
      padding: 8px;
      min-height: 100px;
    }
    #zettel-lexical-editor {
      outline: none;
    }
  `;

  @property({ type: Object })
  accessor zettel: Zettel = [] as any;

  // Store the Lexical editor instance
  private editor: LexicalEditor | null = null;
  // Store the combined unregister function
  private unregisterListeners: (() => void) | null = null;

  createRenderRoot() {
    return this;
  }

  render() {
    return html`
      <div id="zettel-lexical-editor" contenteditable="true"></div>
    `;
  }

  protected firstUpdated(_changedProperties: PropertyValues<this>): void {
    const editor: LexicalEditor = createEditor({
      onError: (error: Error) => {
        throw error;
      },
      nodes: [TextBlockNode, ZettelSpanNode],
    });
    const container = this.renderRoot.querySelector("#zettel-lexical-editor");

    if (!container) {
      console.error("Editor container not found!");
      return;
    }

    editor.setRootElement(container as HTMLElement);
    this.editor = editor; // Store editor instance

    // Custom handler for italic formatting with ZettelSpanNode
    editor.registerCommand<string>(
      FORMAT_TEXT_COMMAND,
      (formatType) => {
        if (formatType !== "italic") {
          console.log(
            "[FORMAT_TEXT_COMMAND] Ignoring non-italic format:",
            formatType,
          );
          return false; // Only handle italic for now
        }

        const selection = $getSelection();
        console.log("[FORMAT_TEXT_COMMAND] Triggered for format:", formatType);

        if (!$isRangeSelection(selection)) {
          console.warn("[FORMAT_TEXT_COMMAND] Selection is not RangeSelection");
          return false; // Should not happen with Cmd+I but good practice
        }

        // Use the most up-to-date AST from the property
        const currentZettel = [...this.zettel]; // Clone the current AST
        let astWasModified = false;

        const nodes = selection.getNodes();
        console.log("[FORMAT_TEXT_COMMAND] Selected Lexical nodes:", nodes);

        // --- Simplified Case: Selection within a single TextNode ---
        if (nodes.length === 1 && $isTextNode(nodes[0])) {
          const selectedNode = nodes[0];
          // We need the Zettel Span Key. Assuming ZettelSpanNode stores it or can provide it.
          // Let's assume the Lexical node key *is* the Zettel span key for now.
          // This might need adjustment based on ZettelSpanNode implementation.
          const zettelSpanKey = selectedNode.getKey();
          const startOffset = Math.min(
            selection.anchor.offset,
            selection.focus.offset,
          );
          const endOffset = Math.max(
            selection.anchor.offset,
            selection.focus.offset,
          );
          const selectionLength = endOffset - startOffset;
          console.log("[FORMAT_TEXT_COMMAND] Single TextNode selected:", {
            zettelSpanKey,
            startOffset,
            endOffset,
            selectionLength,
          });

          if (selectionLength === 0) {
            console.log(
              "[FORMAT_TEXT_COMMAND] Zero length selection, nothing to format.",
            );
            // Return true because we handled the command intent, even if no change occurred.
            // Prevents potential default Lexical behavior.
            return true;
          }

          // Find the corresponding Zettel block and span in our AST
          for (const block of currentZettel) {
            if (block._type === "zettel.textBlock") {
              const textBlock = block as ZettelTextBlock;
              // Find the index of the span matching the selected node's key
              const spanIndex = textBlock.children.findIndex(
                (span) => span._key === zettelSpanKey,
              );

              if (spanIndex !== -1) {
                const originalSpan = textBlock.children[spanIndex];
                console.log(
                  "[FORMAT_TEXT_COMMAND] Found matching Zettel span:",
                  originalSpan,
                );

                // --- Splitting Logic using Offsets ---
                const newSpans: ZettelSpan[] = [];
                const originalText = originalSpan.text;

                // 1. Text before selection (if any)
                if (startOffset > 0) {
                  const beforeText = originalText.substring(0, startOffset);
                  newSpans.push({
                    _type: "zettel.span",
                    _key: generateKey(), // New key for the new span
                    text: beforeText,
                    marks: [...originalSpan.marks], // Inherit marks
                  });
                }

                // 2. Selected text with toggled mark
                const selectedText = originalText.substring(
                  startOffset,
                  endOffset,
                );
                const selectedMarks = [...originalSpan.marks]; // Start with original marks
                const hasItalic = selectedMarks.includes("italic"); // Check if italic mark exists

                if (!hasItalic) {
                  selectedMarks.push("italic"); // Add italic mark
                } else {
                  // Remove italic mark
                  const italicIndex = selectedMarks.indexOf("italic");
                  if (italicIndex !== -1) {
                    selectedMarks.splice(italicIndex, 1);
                  }
                }

                newSpans.push({
                  _type: "zettel.span",
                  _key: generateKey(), // New key for the formatted span
                  text: selectedText,
                  marks: selectedMarks,
                });

                // 3. Text after selection (if any)
                if (endOffset < originalText.length) {
                  const afterText = originalText.substring(endOffset);
                  newSpans.push({
                    _type: "zettel.span",
                    _key: generateKey(), // New key for the remaining part
                    text: afterText,
                    marks: [...originalSpan.marks], // Inherit marks
                  });
                }

                // Replace the original span in the AST with the new spans
                textBlock.children.splice(spanIndex, 1, ...newSpans);
                console.log("[FORMAT_TEXT_COMMAND] Split span into:", newSpans);
                astWasModified = true;
                break; // Found and processed the span, exit block loop
              } else {
                console.warn(
                  "[FORMAT_TEXT_COMMAND] Could not find Zettel span with key:",
                  zettelSpanKey,
                );
              }
            }
          }
        } else if (nodes.length > 1) {
          // TODO: Handle multi-node selection
          console.warn(
            "[FORMAT_TEXT_COMMAND] Selection spans multiple nodes. Multi-node formatting not implemented yet.",
          );
          // Return true to prevent default behavior even though we didn't modify
          return true;
        } else {
          console.warn(
            "[FORMAT_TEXT_COMMAND] Selection does not contain a TextNode.",
          );
          // Return true to prevent default behavior
          return true;
        }

        // If the AST was changed, dispatch the update event
        if (astWasModified) {
          console.log(
            "[FORMAT_TEXT_COMMAND] Dispatching updated Zettel AST:",
            currentZettel,
          );
          this.dispatchEvent(
            new CustomEvent("zettel-ast-updated", {
              detail: currentZettel,
              bubbles: true,
              composed: true,
            }),
          );
        } else {
          console.log(
            "[FORMAT_TEXT_COMMAND] No modifications made to the AST.",
          );
        }

        // Command was handled (or intentionally ignored for multi-node), prevent default behavior
        return true;
      },
      COMMAND_PRIORITY_CRITICAL,
    );

    // --- Initial State Setup ---
    this.setEditorStateFromZettel(this.zettel);

    // Register listeners
    const unregisterStateListener = editor.registerUpdateListener(
      ({ editorState }) => {
        this.syncZettelFromEditorState(editorState);
      },
    );

    const unregisterKeybindings = registerKeybindings(editor);
    const unregisterCommandHandlers = registerCommandHandlers(editor);

    // Combine all unregister functions
    this.unregisterListeners = () => {
      unregisterStateListener();
      unregisterKeybindings();
      unregisterCommandHandlers();
    };
  }

  protected updated(_changedProperties: PropertyValues<this>): void {
    if (_changedProperties.has("zettel")) {
      // Always update the editor state when the zettel prop changes externally
      this.setEditorStateFromZettel(this.zettel);
    }
  }

  // Helper function to update editor state from Zettel AST
  private setEditorStateFromZettel(zettelData: Zettel): void {
    if (!this.editor) return;

    this.editor.update(() => {
      const root = $getRoot();
      root.clear(); // Clear existing content

      let blocksAdded = false;
      (zettelData || []).forEach((block) => {
        if (block._type === "zettel.textBlock") {
          const textBlock = block as ZettelTextBlock;
          // Pass the zettelKey from the AST
          const textBlockNode = $createTextBlockNode(
            textBlock.style,
            block._key,
          );

          // Process spans within the block
          const spanNodes = textBlock.children
            .map((span) => {
              if (span._type === "zettel.span") {
                // Pass the zettelKey from the AST
                const spanNode = this.createZettelSpanNode(
                  span.text,
                  span.marks ?? [],
                  span._key,
                );
                return spanNode;
              }
              return null; // Or handle other span types
            })
            .filter((node): node is ZettelSpanNode => node !== null);

          // Append all spans at once
          textBlockNode.append(...spanNodes);
          root.append(textBlockNode);
          blocksAdded = true;
        }
        // TODO: Handle other block types if needed
      });

      // Ensure there's at least one block if initial data is empty
      if (!blocksAdded) {
        const defaultBlock = $createTextBlockNode("normal");
        // Generate a key for the default initial span
        const defaultSpanKey = generateKey();
        const defaultSpan = this.createZettelSpanNode("", [], defaultSpanKey);
        defaultBlock.append(defaultSpan);
        root.append(defaultBlock);
      }

      // Move cursor to the beginning (optional)
      // root.selectStart();
    });
  }

  // Helper function to convert Lexical state to Zettel and dispatch event
  private syncZettelFromEditorState(editorState: EditorState): void {
    const newZettel: Zettel = [];

    console.log(
      "[syncZettelFromEditorState] Starting conversion from Lexical to Zettel AST",
    );

    editorState.read(() => {
      const root = $getRoot();
      const children = root.getChildren();

      console.log(
        "[syncZettelFromEditorState] Root children count:",
        children.length,
      );

      children.forEach((lexNode) => {
        if ($isTextBlockNode(lexNode)) {
          const textBlockNode = lexNode as TextBlockNode;
          const zettelSpans: ZettelSpan[] = [];

          console.log("[syncZettelFromEditorState] Processing TextBlockNode:", {
            key: textBlockNode.getKey(),
            zettelKey: textBlockNode.__zettelKey,
            style: textBlockNode.__zettelStyle,
          });

          // Iterate over children (should be ZettelSpanNodes)
          const blockChildren = textBlockNode.getChildren();
          console.log(
            "[syncZettelFromEditorState] TextBlock children count:",
            blockChildren.length,
          );

          blockChildren.forEach((child) => {
            console.log("[syncZettelFromEditorState] Processing child:", {
              key: child.getKey(),
              type: child.getType(),
              isZettelSpan: ZettelSpanNode.$isZettelSpanNode(child),
              text: child.getTextContent?.(),
            });

            if (ZettelSpanNode.$isZettelSpanNode(child)) {
              const zettelChild = child as ZettelSpanNode;
              const key = zettelChild.getZettelKey();
              const marks = zettelChild.getMarks();

              console.log(
                "[syncZettelFromEditorState] ZettelSpanNode details:",
                {
                  key,
                  text: zettelChild.getTextContent(),
                  marks,
                },
              );

              zettelSpans.push({
                _type: "zettel.span",
                _key: key,
                text: zettelChild.getTextContent(),
                marks: marks,
              });
            }
            return null;
          });

          console.log(
            "[syncZettelFromEditorState] Created ZettelSpans:",
            zettelSpans,
          );

          const zettelBlock: ZettelTextBlock = {
            _type: "zettel.textBlock",
            _key: textBlockNode.__zettelKey, // Use the stored Zettel key
            style: textBlockNode.__zettelStyle ?? "normal",
            children: zettelSpans,
            markDefs: [], // Assuming markDefs are handled elsewhere or not needed here
            metadata: undefined,
          };
          newZettel.push(zettelBlock);
        }
        // TODO: Handle other root node types if needed
      });
    });

    console.log("[syncZettelFromEditorState] Final Zettel AST:", newZettel);

    // Dispatch event with the new Zettel AST object
    this.dispatchEvent(
      new CustomEvent("zettel-ast-updated", {
        detail: newZettel,
        bubbles: true,
        composed: true,
      }),
    );
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    // Clean up listeners when the element is removed
    if (this.unregisterListeners) {
      this.unregisterListeners();
    }
    this.editor = null;
  }

  createZettelSpanNode(
    text: string,
    marks: string[],
    zettelKey: string,
  ): ZettelSpanNode {
    // Call the standalone creator function
    return ZettelSpanNode.$createZettelSpanNode(text, marks, zettelKey);
  }
}

// Declare the custom element type globally for TypeScript
declare global {
  interface HTMLElementTagNameMap {
    "zettel-editor": ZettelEditor;
  }
}
