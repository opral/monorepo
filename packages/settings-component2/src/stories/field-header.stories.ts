import "./field-header.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"

const meta: Meta = {
	component: "field-header",
	title: "Private/field-header",
	tags: ["autodocs"],
}

export default meta

export const Default: StoryObj = {
	render: () =>
		html`
			<field-header
				.fieldTitle=${"Field Title"}
				.description=${"Description"}
				.examples=${"['Examples']"}
			></field-header>
		`,
}
