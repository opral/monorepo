import type { Meta, StoryObj } from "@storybook/web-components";
import { type EditorProps } from "./editor.js";
import { html } from "lit";
import { spreadProps } from "@open-wc/lit-helpers";
import "./editor.js";

const meta: Meta<EditorProps> = {
  title: "Editor",
  tags: ["autodocs"],
  render: (args) => `<zettel-editor></zettel-editor>`,
  argTypes: {},
  args: { zettel: [] },
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
