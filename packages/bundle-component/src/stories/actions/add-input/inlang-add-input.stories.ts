import { pluralBundle } from "@inlang/sdk2"
import "./inlang-add-input.ts"
import "./../../inlang-bundle.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"

const meta: Meta = {
	component: "inlang-add-input",
	title: "Public/Actions/inlang-add-input",
	argTypes: {
		messages: { control: "object" },
	},
}

export default meta

export const Example: StoryObj = {
	render: () => {
		return html`<style>
				.container {
					padding-bottom: 200px;
				}
			</style>
			<div class="container">
				<inlang-add-input messages=${pluralBundle.messages}>Press me</inlang-add-input>
			</div>`
	},
}
