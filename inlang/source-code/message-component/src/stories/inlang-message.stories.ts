import "./inlang-message.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"

const meta: Meta = {
	component: "inlang-message",
	title: "Public/inlang-message",
}

export default meta

export const Props: StoryObj = {
	render: () => html`<inlang-message></inlang-message> `,
}
