import {
  $getRoot,
  $getNodeByKey,
  $isParagraphNode,
  EditorState,
  LexicalEditor,
  LexicalNode,
  NodeKey,
  ParagraphNode,
} from "lexical";
import {
  generateKey,
  type Zettel,
  type ZettelSpan,
  type ZettelTextBlock,
} from "@opral/zettel-ast";
import {
  $createZettelTextBlockNode,
  $createZettelSpanNode,
  $isZettelSpanNode,
  $isZettelTextBlockNode,
  ZettelSpanNode,
} from "../nodes.js";

/**
 * Converts the live Lexical editor state to a Zettel AST.
 * Traverses the node tree within an editorState.read() block.
 * @param editorState The Lexical EditorState to convert.
 * @param editor The LexicalEditor instance.
 * @returns A Zettel AST array.
 */
export function exportZettelAST(
  editorState: EditorState,
  editor: LexicalEditor,
): Zettel {
  let zettel: Zettel = [];
  const pendingKeyUpdates = new Map<NodeKey, string>();

  editorState.read(() => {
    const root = $getRoot();
    root.getChildren().forEach((node: LexicalNode) => {
      if ($isParagraphNode(node)) {
        const paragraphNode: ParagraphNode = node;
        let blockKey: string = generateKey();
        if ($isZettelTextBlockNode(paragraphNode)) {
          blockKey = paragraphNode.__zettelKey ?? blockKey;
        }
        const zettelBlock: ZettelTextBlock = {
          _type: "zettel.textBlock",
          _key: blockKey,
          style: "normal",
          children: [],
          markDefs: [],
        };

        const spans: ZettelSpan[] = [];
        let currentGroup: ZettelSpanNode[] = [];

        paragraphNode
          .getChildren()
          .forEach((childNode: LexicalNode, index: number) => {
            if ($isZettelSpanNode(childNode)) {
              const textNode = childNode;

              if (
                currentGroup.length > 0 &&
                (textNode.getFormat() !== currentGroup[0].getFormat() ||
                  textNode.__zettelKey !== currentGroup[0].__zettelKey)
              ) {
                const firstNode = currentGroup[0];
                let groupZettelKey = firstNode.__zettelKey;
                if (groupZettelKey === undefined) {
                  groupZettelKey = generateKey();
                  currentGroup.forEach((node) =>
                    pendingKeyUpdates.set(node.__key, groupZettelKey!),
                  );
                }
                spans.push({
                  _type: "zettel.span",
                  _key: groupZettelKey,
                  text: currentGroup.map((n) => n.getTextContent()).join(""),
                  marks: exportTextFormat(firstNode.getFormat()),
                });
                currentGroup = [];
              }

              currentGroup.push(textNode);

              if (
                index === paragraphNode.getChildren().length - 1 &&
                currentGroup.length > 0
              ) {
                const firstNode = currentGroup[0];
                let groupZettelKey = firstNode.__zettelKey;
                if (groupZettelKey === undefined) {
                  groupZettelKey = generateKey();
                  currentGroup.forEach((node) =>
                    pendingKeyUpdates.set(node.__key, groupZettelKey!),
                  );
                }
                spans.push({
                  _type: "zettel.span",
                  _key: groupZettelKey,
                  text: currentGroup.map((n) => n.getTextContent()).join(""),
                  marks: exportTextFormat(firstNode.getFormat()),
                });
              }
            }
          });

        zettelBlock.children = spans;

        // Add the processed block to the Zettel array
        zettel.push(zettelBlock);
      } else {
        console.warn("Unsupported top-level node type:", node.getType());
      }
    });
  });

  if (pendingKeyUpdates.size > 0) {
    Promise.resolve().then(() => {
      editor.update(
        () => {
          pendingKeyUpdates.forEach((zettelKey, nodeKey) => {
            const node = $getNodeByKey<LexicalNode>(nodeKey);
            if (node && $isZettelSpanNode(node)) {
              node.getWritable().__zettelKey = zettelKey;
            }
          });
        },
        { tag: "zettel-key-update" },
      );
    });
  }

  return zettel;
}

/**
 * Converts a Zettel AST into Lexical nodes and updates the editor state.
 * @param zettel The Zettel AST to import.
 * @param editor The LexicalEditor instance.
 */
export function importZettelAST(zettel: Zettel, editor: LexicalEditor): void {
  editor.update(() => {
    const root = $getRoot();
    root.clear();

    if (!zettel || zettel.length === 0) return;

    zettel.forEach((block) => {
      if (block._type === "zettel.textBlock") {
        const paragraphNode = $createZettelTextBlockNode();

        (block as ZettelTextBlock).children.forEach((span: ZettelSpan) => {
          if (span._type === "zettel.span") {
            const textNode = $createZettelSpanNode(span.text);

            let format = 0;
            if (span.marks?.includes("bold")) {
              format |= 1;
            }
            if (span.marks?.includes("italic")) {
              format |= 2;
            }

            if (format > 0) {
              textNode.setFormat(format);
            }
            paragraphNode.append(textNode);
          }
        });

        root.append(paragraphNode);
      }
    });
  });
}

function exportTextFormat(format: number): ZettelSpan["marks"] {
  const marks: ZettelSpan["marks"] = [];
  if (format & 1) marks.push("strong");
  if (format & 2) marks.push("emphasis");
  return marks;
}
