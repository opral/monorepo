import type { Meta, StoryObj } from "@storybook/react";
import { ThreadComposer, ThreadComposerProps } from "./composer";
import { fromPlainText } from "@lix-js/sdk/zettel-ast";

const meta: Meta<ThreadComposerProps> = {
  title: "Thread/Composer",
  component: ThreadComposer,
  tags: ["autodocs"],
};

export default meta;

type Story = StoryObj<ThreadComposerProps>;

export const Default: Story = {
  args: {
    initialContent: fromPlainText("Hello world!"),
  },
};

export const Reply: Story = {
  args: {
    threadId: "thread-123",
    initialContent: fromPlainText("This is a reply."),
  },
};

export const WithSubmitHandler: Story = {
  args: {
    initialContent: fromPlainText("Try submitting this!"),
    onSubmit: (payload) => alert(`Submitted: ${JSON.stringify(payload)}`),
  },
};
