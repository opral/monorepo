import { html } from "lit"
import "./ui-button.ts"
import type { Meta, StoryObj } from "@storybook/web-components"

const meta: Meta = {
	component: "ui-button",
	title: "Private/ui-button",
	tags: ["autodocs"],
	argTypes: {
		label: { type: "string" },
		variant: {
			control: { type: "select" },
			options: ["default", "primary", "success", "neutral", "warning", "danger", "text"],
		},
		size: {
			control: { type: "select" },
			options: ["small", "medium", "large"],
		},
	},
}

export default meta

export const Primary: StoryObj = {
	args: {
		variant: "primary",
		label: "Button",
		size: "medium",
	},
}

export const Big: StoryObj = {
	args: {
		...Primary.args,
		variant: "success",
		size: "large",
	},
}

export const Test: StoryObj = {
	render: () => html` <ui-button label="Test" size="medium" variant="primary"></ui-button> `,
}
