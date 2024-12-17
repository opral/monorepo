import "./inlang-doc-layout.ts";
import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import {
  manifest,
  manifestWithoutNamespace,
  html as mockhtml,
} from "./../mock/manifest.ts";
import { unsafeHTML } from "lit/directives/unsafe-html.js";

const meta: Meta = {
  component: "inlang-doc-layout",
  title: "Public/inlang-doc-layout",
};

export default meta;

export const Props: StoryObj = {
  render: () =>
    html`<inlang-doc-layout .manifest=${manifest} .currentRoute=${"/"}
      >${unsafeHTML(mockhtml)}</inlang-doc-layout
    > `,
};

export const Attributes: StoryObj = {
  render: () => html`
    <inlang-doc-layout manifest=${JSON.stringify(manifest)} .currentRoute=${"/"}
      >${unsafeHTML(mockhtml)}</inlang-doc-layout
    >
  `,
};

export const Flat: StoryObj = {
  render: () => html`
    <inlang-doc-layout
      manifest=${JSON.stringify(manifestWithoutNamespace)}
      .currentRoute=${"/"}
      >${unsafeHTML(mockhtml)}</inlang-doc-layout
    >
  `,
};
