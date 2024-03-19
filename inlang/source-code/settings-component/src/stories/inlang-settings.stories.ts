import "./inlang-settings.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { mockProject } from "../mock/project.js"
import { html } from "lit"

const meta: Meta = {
	component: "inlang-settings",
	title: "Public/inlang-settings",
	tags: ["autodocs"],
}

export default meta

export const Default: StoryObj = {
	render: () =>
		html`
			<inlang-settings
				.project=${mockProject}
				@onSetSettings=${(settings: any) => console.info("save", settings)}
			></inlang-settings>
		`,
}
