import "./inlang-message-bundle.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"
import { pluralBundle } from "@inlang/sdk/v2-mocks"
import {
	mockInstalledLintRules,
	mockMessageLintReports,
	mockVariantLintReports,
} from "./../mock/lint.ts"
import { mockSettings } from "./../mock/settings.ts"
import { bundleWithoutSelectors } from "./../mock/messageBundle.ts"

const meta: Meta = {
	component: "inlang-message-bundle",
	title: "Public/inlang-message-bundle",
	argTypes: {
		messageBundle: {
			control: { type: "object" },
			description: "Type MessageBundle: see sdk v2",
		},
		settings: {
			control: { type: "object" },
			description: "Type ProjectSettings2: see sdk v2",
		},
		installedLintRules: {
			control: { type: "Array" },
			description:
				"Optional: Type InstalledLintRule[]: see sdk v2. If defined the reports will be shown with more meta data.",
		},
		filteredLocales: {
			control: { type: "Array" },
			description:
				"Optional: Type LanguageTag[]. Pass it in when you want to filter the locales of the bundle. If not passed, all locales will be shown.",
		},
	},
}

export default meta

export const Simple: StoryObj = {
	render: () =>
		html`<inlang-message-bundle
			.messageBundle=${bundleWithoutSelectors}
			.settings=${mockSettings}
			.filteredLocales=${["en", "de"]}
			@change-message-bundle=${(data: any) =>
				console.info("changeMessageBundle", data.detail.argument)}
			@fix-lint=${(data: any) => console.info("fixLint", data.detail.argument)}
		></inlang-message-bundle> `,
}

export const Complex: StoryObj = {
	render: () =>
		html`<inlang-message-bundle
			.messageBundle=${pluralBundle}
			.settings=${mockSettings}
			.installedLintRules=${mockInstalledLintRules}
			@change-message-bundle=${(data: any) =>
				console.info("changeMessageBundle", data.detail.argument)}
			@fix-lint=${(data: any) => console.info("fixLint", data.detail.argument)}
		>
			<div
				slot="bundle-action"
				@click=${() => {
					console.log("copy link")
				}}
			>
				Share
			</div>
			<div
				slot="bundle-action"
				@click=${() => {
					console.log("open edit alias")
				}}
			>
				Edit alias
			</div>
		</inlang-message-bundle> `,
}

export const Styled: StoryObj = {
	render: () =>
		html`
			<style>
				.dark::part(header) {
					background-color: #000;
				}

				.dark {
					--inlang-color-primary: #f97316;

					/* input & button */
					--sl-input-background-color: #313131;
					--sl-input-background-color-hover: #000;
					--sl-input-border-color: #606060;
					--sl-input-border-color-hover: #646464;
					--sl-input-color: #e0e0e0;
					--sl-input-color-focus: #ffffff;
					--sl-input-color-hover: #ffffff;
					--sl-input-placeholder-color: #a0a0a0;
					--sl-input-background-color-disabled: #242424;

					/* focus ring */
					--sl-input-focus-ring-color: var(--inlang-color-primary);
					--sl-focus-ring-width: 2px;

					/* tooltip */
					--sl-tooltip-background-color: #000000;
					--sl-tooltip-color: #e0e0e0;

					/* panel */
					--sl-panel-background-color: #242424;
					--sl-input-help-text-color: #b0b0b0;
					--sl-panel-border-color: #606060;
				}
			</style>

			<inlang-message-bundle
				class="dark"
				.messageBundle=${pluralBundle}
				.settings=${mockSettings}
				.lintReports=${[...mockMessageLintReports, ...mockVariantLintReports]}
				.installedLintRules=${mockInstalledLintRules}
				@change-message-bundle=${(data: any) =>
					console.info("changeMessageBundle", data.detail.argument)}
				@fix-lint=${(data: any) => console.info("fixLint", data.detail.argument)}
			>
				<div
					slot="bundle-action"
					@click=${(e) => {
						console.log("event", e)
					}}
				>
					Share
				</div>
				<div
					slot="bundle-action"
					@click=${(e) => {
						console.log("open edit alias")
					}}
				>
					Edit alias
				</div>
			</inlang-message-bundle>
		`,
}
