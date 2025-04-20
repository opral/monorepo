import type {
  Meta,
  StoryObj,
  WebComponentsRenderer,
} from "@storybook/web-components";
import { type EditorProps } from "./editor.js";
import { html } from "lit";
import { spreadProps } from "@open-wc/lit-helpers";
import "./editor.js";

const meta: Meta<EditorProps> = {
  title: "Editor",
  tags: ["autodocs"],
  render: function Render(args) {
    const handleLexicalStateUpdate = (e: CustomEvent) => {
      const textarea = document.getElementById(
        "lexical-state-display",
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = JSON.stringify(e.detail, null, 2);
        textarea.style.height = "auto";
        textarea.style.height = `${textarea.scrollHeight}px`;
      }
    };

    return html`
      <zettel-editor
        ${spreadProps(args)}
        @lexical-state-updated=${handleLexicalStateUpdate}
        style="border: 1px solid #ccc; min-height: 100px; display: block;"
      ></zettel-editor>
      <textarea
        id="lexical-state-display"
        readonly
        style="width: 100%; margin-top: 10px; font-family: monospace; font-size: 12px; box-sizing: border-box; overflow: hidden; resize: none; min-height: 70px;"
        placeholder="Lexical Editor State JSON will appear here..."
      ></textarea>
    `;
  },
  argTypes: {},
  args: {},
};

export default meta;

type Story = StoryObj<EditorProps>;

export const Default: Story = {};
