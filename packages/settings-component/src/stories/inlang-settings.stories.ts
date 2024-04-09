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
					font-size: 14px;
				}
				inlang-settings::part(property-paragraph) {
					color: blue;
				}
				inlang-settings {
					--sl-input-background-color: red;
					--sl-input-color: white;
					--sl-input-placeholder-color: white;
					--sl-input-filled-background-color-disabled: blue;

					--inlang-color-primary: #f97316;
					--inlang-color-neutral: #64748b;
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

export const DarkTheme: StoryObj = {
	render: () =>
		html`
			<style>
				inlang-settings::part(base) {
					background-color: black;
					padding: 20px 32px;
				}
				inlang-settings::part(property-title) {
					color: white;
				}
				inlang-settings::part(module-title) {
					color: white;
				}
				inlang-settings::part(property-paragraph) {
					color: #e0e0e0;
				}
				inlang-settings::part(float) {
					background-color: black;
					color: #e0e0e0;
					border: 1px solid #606060;
				}
				inlang-settings::part(cancel) {
					background-color: #242424;
					color: #e0e0e0;
					border: 1px solid #606060;
				}

				inlang-settings::part(option-wrapper) {
					background-color: #242424;
					border: 1px solid #606060;
				}
				inlang-settings::part(option) {
					color: #ffffff;
				}
				inlang-settings::part(option):hover {
					background-color: #646464;
				}

				inlang-settings {
					--sl-input-background-color: #313131;
					--sl-input-border-color: #606060;
					--sl-input-color: #e0e0e0;
					--sl-input-border-radius-small: 4px;
					--sl-input-border-width: 1px;
					--sl-input-placeholder-color: #a0a0a0;
					--sl-input-color-hover: #eeeeee;

					--sl-input-help-text-color: #b0b0b0;

					--sl-input-background-color-disabled: #242424;
					--sl-input-border-color-disabled: transparent;
					--sl-input-placeholder-color-disabled: #b4b4b4;
					--sl-input-color-disabled: #c0c0c0;

					--sl-input-filled-background-color-disabled: #424242;

					--inlang-color-primary: #f97316;
					--sl-input-focus-ring-color: unset;
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