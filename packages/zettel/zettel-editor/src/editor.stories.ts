import type {
  Meta,
  StoryObj,
  WebComponentsRenderer,
} from "@storybook/web-components";
import { type EditorProps } from "./editor.js";
import { html } from "lit";
import { spreadProps } from "@open-wc/lit-helpers";
import "./editor.js";
import type { ZettelEditor } from "./editor.js";

const meta: Meta<EditorProps> = {
  title: "Editor",
  tags: ["autodocs"],
  render: function Render(args) {
    const handleZettelASTUpdate = (e: CustomEvent) => {
      const textarea = document.getElementById(
        "zettel-ast-display",
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = JSON.stringify(e.detail.ast, null, 2);
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    return html`
      <zettel-editor
        ${spreadProps(args)}
        @zettel-update=${handleZettelASTUpdate}
        style="border: 1px solid #ccc; min-height: 100px; display: block;"
      ></zettel-editor>
      <textarea
        id="zettel-ast-display"
        readonly
        style="width: 100%; margin-top: 10px; font-family: monospace; font-size: 12px; box-sizing: border-box; overflow: hidden; resize: none; min-height: 70px;"
        placeholder="Zettel AST will appear here..."
      ></textarea>
    `;
  },
  argTypes: {},
  args: {},
  play: async ({ canvasElement }) => {
    const editor = canvasElement.querySelector(
      "zettel-editor",
    ) as ZettelEditor;
    const outputArea = canvasElement.querySelector(
      "#zettel-ast-display",
    ) as HTMLTextAreaElement;

    if (editor && outputArea) {
      editor.addEventListener("zettel-update", (event) => {
        const zettelAST = (event as CustomEvent).detail.ast;
        outputArea.value = JSON.stringify(zettelAST, null, 2);
      });
    } else {
      console.error("Editor or output area not found");
    }
  },
};

export default meta;

type Story = StoryObj<EditorProps>;

export const Default: Story = {};
