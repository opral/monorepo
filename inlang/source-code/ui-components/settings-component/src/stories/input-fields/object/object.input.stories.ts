import "./object-input.js"
import type { Meta, StoryObj } from "@storybook/web-components"

const meta: Meta = {
	component: "object-input",
	title: "Private/input/object",
	tags: ["autodocs"],
	argTypes: {
		property: { type: "string" },
		value: { control: { type: "array" } },
		schema: { control: { type: "object" } },
		moduleId: { type: "string" },
	},
}

export default meta

export const Default: StoryObj = {
	args: {
		property: "test proptery",
		value: { test: "value" },
		schema: {
			type: "object",
			description: "This is a description",
		},
	},
}
