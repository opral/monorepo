import "./inlang-message-bundle.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"
import { mockMessageBundle } from "../mock/message.js"

const meta: Meta = {
	component: "inlang-message-bundle",
	title: "Public/inlang-message-bundle",
}

export default meta

export const Props: StoryObj = {
	render: () =>
		html`<inlang-message-bundle
			messageBundle=${JSON.stringify(mockMessageBundle)}
		></inlang-message-bundle> `,
}
