import "./inlang-settings.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import {
	mockSettings,
	mockInstalledPlugins,
	mockInstalledMessageLintRules,
} from "../mock/project.js"
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
				.installedPlugins=${mockInstalledPlugins}
				.installedMessageLintRules=${mockInstalledMessageLintRules}
				@set-settings=${(settings: any) => console.info("save", settings)}
			></inlang-settings>
		`,
}

export const Stringified: StoryObj = {
	render: () =>
		html`
			<inlang-settings
				settings=${JSON.stringify(mockSettings)}
				installedPlugins=${JSON.stringify(mockInstalledPlugins)}
				installedMessageLintRules=${JSON.stringify(mockInstalledMessageLintRules)}
			></inlang-settings>
			<script>
				document.querySelector("inlang-settings").addEventListener("set-settings", (settings) => {
					console.info("save", settings)
				})
			</script>
		`,
}

export const StyledWithPartAPI: StoryObj = {
	render: () =>
		html`
			<style>
				inlang-settings::part(property) {
					background: lightblue;
				}
				inlang-settings::part(property-title) {
					font-size: 1rem;
				}
				inlang-settings::part(property-paragraph) {
					color: blue;
				}
				inlang-settings {
					--sl-color-primary-600: hsl(333.3 71.4% 50.6%);
				}
				inlang-settings {
					--sl-input-background-color: red;
					--sl-input-color: white;
					--sl-input-placeholder-color: white;
					--sl-input-filled-background-color-disabled: blue;
				}
			</style>
			<inlang-settings
				.settings=${mockSettings}
				.installedPlugins=${mockInstalledPlugins}
				.installedMessageLintRules=${mockInstalledMessageLintRules}
				@set-settings=${(settings: any) => console.info("save", settings)}
			></inlang-settings>
		`,
}