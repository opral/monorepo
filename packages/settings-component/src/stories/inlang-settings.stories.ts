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
				.settings=${mockProject}
				.onSetSettings=${(settings: any) => console.info("save", settings)}
			></inlang-settings>
		`,
}

const setSetting = (settings: any) => {
	console.info(settings)
}

export const HTML: StoryObj = {
	render: () =>
		`
		<inlang-settings
			id="my-element"
			settings=${JSON.stringify(mockProject)}
			onSetSettings=${setSetting}
		></inlang-settings>
	`,
}
