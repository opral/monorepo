import Document from "@tiptap/extension-document";
import Paragraph from "@tiptap/extension-paragraph";
import Text from "@tiptap/extension-text";
import HardBreak from "@tiptap/extension-hard-break";
import Placeholder from "@tiptap/extension-placeholder";
import History from "@tiptap/extension-history";
import FloatingMenu from "@tiptap/extension-floating-menu";
import { setTipTapMessage } from "./parse.js";
import PlaceholderNode from "./customExtensions/placeholder.js";
import type { Variant, VariableReference } from "@inlang/sdk";

export const getEditorConfig = (
  ref: HTMLDivElement,
  variant: Variant | undefined,
  variableReferences: () => VariableReference[],
) => {
  return {
    element: ref!,
    extensions: [
      HardBreak.extend({
        addKeyboardShortcuts() {
          return {
            Enter: () => this.editor.commands.setHardBreak(),
          };
        },
      }),
      Document,
      Paragraph,
      Text,
      PlaceholderNode.configure({
        HTMLAttributes: {
          class:
            "bg-primary/10 py-[3px] px-[1px] rounded-sm text-on-primary-container text-sm pointer-events-none",
        },
        // @ts-ignore - fix after refactor
        renderLabel({ node }: any) {
          return `${node.attrs.label ?? node.attrs.id}`;
        },
      }),
      Placeholder.configure({
        emptyEditorClass: "is-editor-empty",
        placeholder: "Enter translation...",
      }),
      History.configure({
        depth: 10,
      }),
      FloatingMenu.configure({
        //@ts-ignore
        element: document.querySelector(".variableReference"),
        //@ts-ignore
        shouldShow: ({ editor }) => {
          // show the floating within any paragraph
          if (variableReferences().length > 0) {
            return editor.isActive("paragraph");
          } else {
            return false;
          }
        },
        tippyOptions: {
          duration: 200,
          maxWidth: "300px",
          offset: [36, 0],
        },
      }),
    ],
    editorProps: {
      attributes: {
        class: "focus:outline-none",
        spellcheck: true,
      },
    },
    content:
      variant !== undefined && variant.pattern.length > 0
        ? setTipTapMessage(variant.pattern)
        : undefined,
  };
};
