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
				.settings=${mockProject}
				@onSetSettings=${(settings: any) => console.info("save", settings)}
			></inlang-settings>
		`,
}

export const HTML: StoryObj = {
	render: () =>
		`
		<script>
			document.querySelector('inlang-settings').addEventListener('onSetSettings', (settings) => {
				console.info("save", settings);
		  	});
		</script>
		<inlang-settings
			id="my-element"
			settings=${JSON.stringify(mockProject)}
		></inlang-settings>
	`,
}
