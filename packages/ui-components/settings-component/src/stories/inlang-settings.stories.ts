import "./inlang-settings.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { mockSettings } from "../mock/project.js"
import { html } from "lit"

const meta: Meta = {
	component: "inlang-settings",
	title: "Public/inlang-settings",
	argTypes: {
		settings: {
			control: { type: "object" },
			description:
				"Type ProjectSettings (https://github.com/opral/inlang/blob/main/packages/versioned-interfaces/project-settings/src/interface.ts)",
		},
		installedPlugins: {
			control: { type: "object" },
			description:
				"Type InstalledPlugin[] (https://github.com/opral/inlang/blob/57611514bf84d3e03b179ddf8d02725157ec6bd5/inlang/packages/sdk/src/api.ts#L14)",
		},
	},
};

export default meta

export const Props: StoryObj = {
	render: () =>
		html`
			<inlang-settings
				.settings=${mockSettings}
				@set-settings=${(settings: any) => console.info("save", settings)}
			></inlang-settings>
		`,
}

// export const Attributes: StoryObj = {
// 	render: () =>
// 		html`
// 			<inlang-settings
// 				settings=${JSON.stringify(mockSettings)}
// 				installedPlugins=${JSON.stringify(mockInstalledPlugins)}
// 				installedMessageLintRules=${JSON.stringify(mockInstalledMessageLintRules)}
// 			></inlang-settings>
// 			<script>
// 				document.querySelector("inlang-settings").addEventListener("set-settings", (settings) => {
// 					console.info("save", settings)
// 				})
// 			</script>
// 		`,
// }

// export const Styled: StoryObj = {
// 	render: () =>
// 		html`
// 			<style>
// 				.dark::part(base) {
// 					background-color: black;
// 					padding: 20px 32px;
// 				}
// 				.dark::part(property-title) {
// 					color: white;
// 				}
// 				.dark::part(module-title) {
// 					color: white;
// 				}
// 				.dark::part(property-paragraph) {
// 					color: #e0e0e0;
// 				}
// 				.dark::part(float) {
// 					background-color: black;
// 					color: #e0e0e0;
// 					border: 1px solid #606060;
// 				}
// 				.dark::part(cancel) {
// 					background-color: #242424;
// 					color: #e0e0e0;
// 					border: 1px solid #606060;
// 				}

// 				.dark::part(option-wrapper) {
// 					background-color: #242424;
// 					border: 1px solid #606060;
// 				}
// 				.dark::part(option) {
// 					color: #ffffff;
// 				}
// 				.dark::part(option):hover {
// 					background-color: #646464;
// 				}
// 				.dark::part(button) {
// 					background-color: #242424;
// 					color: white;
// 					border: #404040;
// 				}

// 				.dark {
// 					--sl-input-background-color: #313131;
// 					--sl-input-border-color: #606060;
// 					--sl-input-color: #e0e0e0;
// 					--sl-input-border-radius-small: 4px;
// 					--sl-input-border-width: 1px;
// 					--sl-input-placeholder-color: #a0a0a0;
// 					--sl-input-color-hover: #eeeeee;

// 					--sl-input-help-text-color: #b0b0b0;

// 					--sl-input-background-color-disabled: #242424;
// 					--sl-input-border-color-disabled: transparent;
// 					--sl-input-placeholder-color-disabled: #b4b4b4;
// 					--sl-input-color-disabled: #c0c0c0;

// 					--sl-input-filled-background-color-disabled: #424242;

// 					--inlang-color-primary: #f97316;
// 					--sl-input-focus-ring-color: unset;
// 				}
// 			</style>
// 			<inlang-settings
// 				class="dark"
// 				.settings=${mockSettings}
// 				.installedPlugins=${mockInstalledPlugins}
// 				.installedMessageLintRules=${mockInstalledMessageLintRules}
// 				@set-settings=${(settings: any) => console.info("save", settings)}
// 			></inlang-settings>
// 		`,
// }
