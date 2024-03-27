import "./inlang-settings.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { mockSettings, mockInstalledPlugin, mockInstalledMessageLintRule } from "../mock/project.js"
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
				.settings=${mockSettings}
				.installedPlugins=${mockInstalledPlugin}
				.installedMessageLintRules=${mockInstalledMessageLintRule}
				@setSettings=${(settings: any) => console.info("save", settings)}
			></inlang-settings>
		`,
}

export const Stringified: StoryObj = {
	render: () =>
		html`
			<inlang-settings
				settings=${JSON.stringify(mockSettings)}
				installedPlugins=${JSON.stringify(mockInstalledPlugin)}
				installedMessageLintRules=${JSON.stringify(mockInstalledMessageLintRule)}
			></inlang-settings>
			<script>
				document.querySelector("inlang-settings").addEventListener("setSettings", (settings) => {
					console.info("save", settings)
				})
			</script>
		`,
}
