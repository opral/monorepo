import { fn } from "@storybook/test";
import type { Meta, StoryObj } from "@storybook/web-components";
import { type ButtonProps } from "./button.js";
import { html } from "lit";
import { spreadProps } from "@open-wc/lit-helpers";
import "./button.js";

const meta: Meta<ButtonProps> = {
  title: "Example/Button",
  tags: ["autodocs"],
  render: (args) =>
    html`<storybook-button ${spreadProps(args)}></storybook-button>`,
  argTypes: {
    backgroundColor: { control: "color" },
    size: {
      control: { type: "select" },
      options: ["small", "medium", "large"],
    },
  },
  args: { onClick: fn() },
};

export default meta;

type Story = StoryObj<ButtonProps>;

export const Primary: Story = {
  args: {
    primary: false,
    label: "Button",
    onClick: () => {},
  },
};
