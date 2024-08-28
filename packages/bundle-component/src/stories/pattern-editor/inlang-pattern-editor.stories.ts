import "./inlang-pattern-editor.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"
import { pluralBundle } from "@inlang/sdk2"

const meta: Meta = {
	component: "inlang-pattern-editor",
	title: "Public/inlang-pattern-editor",
	argTypes: {
		variant: { control: "object" }, // Control the variant object through Storybook
	},
}

export default meta

export const Example: StoryObj = {
	render: () => {
		return html`<inlang-pattern-editor
			.variant=${pluralBundle.messages[1].variants[0]}
			@change=${(e) => console.info(e.detail.argument)}
		></inlang-pattern-editor>`
	},
}
