import "./inlang-add-variable.ts";
import "../../inlang-bundle.ts";
import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import { examplePlural } from "../../../mock/pluralBundle.ts";

const meta: Meta = {
  component: "inlang-add-variable",
  title: "Public/Actions/inlang-add-variable",
  argTypes: {
    messages: { control: "object" },
  },
};

export default meta;

export const Example: StoryObj = {
  render: () => {
    return html`<style>
        .container {
          padding-bottom: 400px;
        }
      </style>
      <div class="container">
        <inlang-add-variable
          .bundle=${examplePlural.bundles[0]}
          @change=${(e) => console.info(e.detail.newData.declarations)}
          >Press me</inlang-add-variable
        >
      </div>`;
  },
};
