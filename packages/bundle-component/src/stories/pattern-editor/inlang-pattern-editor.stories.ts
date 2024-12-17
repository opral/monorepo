import "./inlang-pattern-editor.ts";
import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import { examplePlural } from "../../mock/pluralBundle.ts";

const meta: Meta = {
  component: "inlang-pattern-editor",
  title: "Public/inlang-pattern-editor",
  argTypes: {
    variant: { control: "object" }, // Control the variant object through Storybook
  },
};

export default meta;

export const Example: StoryObj = {
  render: () => {
    return html`<inlang-pattern-editor
      .variant=${examplePlural.variants[0]}
      @change=${(e) => console.info(e.detail)}
      @pattern-editor-focus=${(e) => console.info("focus", e.detail)}
      @pattern-editor-blur=${(e) => console.info("blur", e.detail)}
    ></inlang-pattern-editor>`;
  },
};
