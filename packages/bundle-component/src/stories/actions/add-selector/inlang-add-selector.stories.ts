import { pluralBundle } from "@inlang/sdk2"
import "./inlang-add-selector.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"

const meta: Meta = {
	component: "inlang-add-selector",
	title: "Public/Actions/inlang-add-selector",
	argTypes: {
		message: { control: "object" },
		messages: { control: "array" },
	},
}

export default meta

export const Example: StoryObj = {
	render: () => {
		return html`<style>
				.container {
					padding-bottom: 400px;
				}
			</style>
			<div class="container">
				<inlang-add-selector
					.message=${pluralBundle.messages[0]}
					.messages=${pluralBundle.messages}
				></inlang-add-selector>
			</div>`
	},
}
