import type { Accessor } from "solid-js";
import { useEditorJSON } from "solid-tiptap";
import type { EditorRef } from "solid-tiptap";
import type { VariableReference, Pattern, Text } from "@inlang/sdk";

// access tiptap json
export const getTextValue = (editor: Accessor<EditorRef>) => {
  if (editor()) {
    const json = useEditorJSON(() => editor());
    if (json()) {
      const data = json();
      const tiptap_nodes = data.content
        .filter((p: any) => p.content)
        .map((p: any) => p.content)
        .flat();

      const patterns: Array<any> = [];
      if (tiptap_nodes.length === 0) {
        patterns.push({ type: "Text", value: "" } as Text);
      } else {
        tiptap_nodes.map((tiptap_node: any) => {
          switch (tiptap_node.type) {
            case "text":
              if (patterns.at(-1)?.type === "Text") {
                if (tiptap_nodes.at(+1).type === "text") {
                  patterns.at(-1).value += "\n";
                }
                patterns.at(-1).value += tiptap_node.text;
              } else {
                patterns.push({
                  type: "Text",
                  value: tiptap_node.text,
                } as Text);
              }
              break;
            case "placeholderNode":
              patterns.push({
                type: "VariableReference",
                name: tiptap_node.attrs.id,
              } as VariableReference);
              break;
            case "hardBreak":
              if (patterns.at(-1)?.type === "Text") {
                patterns.at(-1).value += "\n";
              } else {
                patterns.push({ type: "Text", value: "\n" } as Text);
              }
              break;
          }
        });
      }
      return patterns;
    }
  }
  return undefined;
};

// setTipTapMessage

export const setTipTapMessage = (patterns: Pattern) => {
  // if no elements in ast message, don't put any nodes in tiptap object
  if (patterns?.length === 0 || patterns === undefined) return undefined;
  const tiptap_nodes: any = [];

  patterns.map((pattern) => {
    switch (pattern.type) {
      case "Text":
        if (pattern.value !== "") {
          const textNodes = pattern.value.split(/(?=[\n])|(?<=[\n])/g);
          textNodes.map((textNode) => {
            if (textNode !== "\n") {
              tiptap_nodes.push({
                type: "text",
                text: textNode,
              });
            } else {
              tiptap_nodes.push({
                type: "hardBreak",
              });
            }
          });
        }
        break;
      case "VariableReference":
        tiptap_nodes.push(getPlaceholderFromAstElement(pattern));
        break;
    }
  });

  const tiptapObject = {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: tiptap_nodes,
      },
    ],
  };
  return tiptapObject;
};

// VARIABLE REFERENCE

const getPlaceholderFromAstElement = (pattern: VariableReference) => {
  return {
    type: "placeholderNode",
    attrs: {
      id: (pattern as VariableReference | undefined)?.name,
      label: (pattern as VariableReference | undefined)?.name,
    },
  };
};
