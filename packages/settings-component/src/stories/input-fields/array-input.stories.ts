import "./array-input.ts"
import type { Meta, StoryObj } from "@storybook/web-components"

const meta: Meta = {
	component: "array-input",
	title: "Private/input/array",
	tags: ["autodocs"],
	argTypes: {
		property: { type: "string" },
		value: { type: "string" },
		schema: { control: { type: "object" } },
		moduleId: { type: "string" },
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
