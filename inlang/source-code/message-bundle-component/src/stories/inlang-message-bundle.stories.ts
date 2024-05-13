import "./inlang-message-bundle.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"

const meta: Meta = {
	component: "inlang-message-bundle",
	title: "Public/inlang-message-bundle",
}

export default meta

export const Props: StoryObj = {
	render: () => html`<inlang-message-bundle></inlang-message-bundle> `,
}
