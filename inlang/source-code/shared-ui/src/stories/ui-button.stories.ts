import { html } from "lit"
import "./ui-button.ts"
import "./overwrite-styles.css"
import type { Meta, StoryObj } from "@storybook/web-components"
import "@shoelace-style/shoelace/dist/components/button/button.js"

const meta: Meta = {
	component: "ui-button",
	title: "Example/ui-button",
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
	render: () => html`
		<sl-button size="medium" variant="primary">Test</sl-button>
		<ui-button label="Test" size="medium" variant="primary"></ui-button>
	`,
}
