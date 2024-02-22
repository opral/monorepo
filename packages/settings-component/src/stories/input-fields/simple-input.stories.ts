import "./simple-input.ts"
import type { Meta, StoryObj } from "@storybook/web-components"

const meta: Meta = {
	component: "simple-input",
	title: "Private/simple-input",
	tags: ["autodocs"],
	argTypes: {
		property: { type: "string" },
		value: { type: "string" },
		schema: { control: { type: "object" } },
	},
}

export default meta

export const Default: StoryObj = {
	args: {
		property: "test property",
		value: "test value",
		schema: {},
	},
}
