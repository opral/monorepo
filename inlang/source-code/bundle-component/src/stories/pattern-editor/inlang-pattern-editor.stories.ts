import "./inlang-pattern-editor.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"
import { pluralBundle, Variant } from "@inlang/sdk2"

const meta: Meta = {
	component: "inlang-pattern-editor",
	title: "Public/inlang-pattern-editor",
	argTypes: {
		variant: { control: "object" }, // Control the variant object through Storybook
	},
}

export default meta

const Template = (args) => {
	const handleChange = (e) => {
		const newVariant = e.detail.argument.newData as Variant
		// Update the args using Storybook's updateArgs function
		args.variant = newVariant
		console.info("Variant updated:", newVariant)
	}

	return html`
		<inlang-pattern-editor .variant=${args.variant} @change=${handleChange}>
		</inlang-pattern-editor>
	`
}

export const Example: StoryObj = Template.bind({})

Example.args = {
	variant: pluralBundle.messages[0].variants[0],
}
