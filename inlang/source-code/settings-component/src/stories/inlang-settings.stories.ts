import "./inlang-settings.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { mockProject } from "../mock/project.js"
import { html } from "lit"

const meta: Meta = {
	component: "inlang-settings",
	title: "Public/inlang-settings",
	tags: ["autodocs"],
	// argTypes: {
	// 	inlangProject: { control: { type: "object" } },
	// },
}

export default meta

export const Default: StoryObj = {
	render: () =>
		html`
			<inlang-settings
				.inlangProject=${mockProject}
				.onSaveProject=${(project: any) => console.info("save", project)}
			></inlang-settings>
		`,
}
