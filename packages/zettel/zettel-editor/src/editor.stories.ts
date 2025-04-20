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
    const handleAstUpdate = (e: CustomEvent) => {
      const textarea = document.getElementById(
        "zettel-ast-display",
      ) as HTMLTextAreaElement;
      if (textarea) {
        textarea.value = JSON.stringify(e.detail, null, 2);
        textarea.style.height = "auto"; // Reset height
        textarea.style.height = `${textarea.scrollHeight}px`; // Set to content height
      }
    };

    return html`
      <zettel-editor
        ${spreadProps(args)}
        @zettel-ast-updated=${handleAstUpdate}
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
  argTypes: {
    zettel: { control: "object" },
  },
  args: {
    zettel: [
      {
        _type: "zettel.textBlock",
        _key: "initKey",
        style: "normal",
        children: [
          {
            _type: "zettel.span",
            _key: "initSpanKey",
            text: "Hello world",
            marks: [],
          },
        ],
      },
    ],
  },
};

export default meta;

type Story = StoryObj<EditorProps>;

export const ZettelTextBlock: Story = {
  args: {
    zettel: [
      {
        _type: "zettel.textBlock",
        _key: "uniqueKey",
        style: "normal",
        children: [
          {
            _type: "zettel.span",
            _key: "uniqueKeySpanKey",
            text: "Hello world",
            marks: [],
          },
        ],
      },
    ],
  },
};
