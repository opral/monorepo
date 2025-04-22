import type { Meta, StoryObj } from "@storybook/web-components";
import { html } from "lit";
import { spreadProps } from "@open-wc/lit-helpers";
import type { ThreadComment } from "@lix-js/sdk"; // Assuming path

import "./comment.js";
import type { LixUiThreadCommentProps } from "./comment.js";

// Mock Portable Text AST
const mockPortableText = [
  {
    _type: "block",
    _key: "mockKey1",
    style: "normal",
    markDefs: [],
    children: [
      {
        _type: "span",
        _key: "mockSpan1",
        text: "Hello world from Storybook!",
        marks: [],
      },
    ],
  },
];

// Mock Comment Data (adjust based on actual Comment type)
const mockComment: ThreadComment = {
  id: "comment-1",
  thread_id: "thread-1",
  parent_id: null, // Or 'some-parent-id' for a reply
  content: mockPortableText, // Use Portable Text AST
};

const meta: Meta<LixUiThreadCommentProps> = {
  title: "Thread/Comment",
  tags: ["autodocs"],
  component: "lix-ui-thread-comment",
  // Render function using spreadProps
  render: (args) =>
    html`<lix-ui-thread-comment ${spreadProps(args)}></lix-ui-thread-comment>`,
  // Define args for the story
  args: {
    comment: mockComment,
  },
  argTypes: {
    comment: {
      control: "object", // Allow editing the comment object in Storybook UI
    },
  },
};

export default meta;

type Story = StoryObj<LixUiThreadCommentProps>;

// Basic story using the default args
export const Default: Story = {};
