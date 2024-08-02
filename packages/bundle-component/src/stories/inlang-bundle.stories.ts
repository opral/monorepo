import "./inlang-bundle.ts"
import "./testing/reactiveWrapper.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"
// import {
// 	mockInstalledLintRules,
// 	mockMessageLintReports,
// 	mockVariantLintReports,
// } from "../mock/lint.ts"
import { mockSettings } from "../mock/settings.ts"
import { bundleWithoutSelectors } from "../mock/messageBundle.ts"
import { pluralBundle } from "@inlang/sdk2"

import "./actions/inlang-bundle-action.ts"
import {
	mockBundleLintReports,
	mockInstalledLintRules,
	mockMessageLintReports,
	mockVariantLintReports,
} from "../mock/lint.ts"

const meta: Meta = {
	component: "inlang-bundle",
	title: "Public/inlang-bundle",
	argTypes: {
		bundle: {
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
	render: () => {
		return html`<inlang-bundle
			.bundle=${bundleWithoutSelectors}
			.settings=${mockSettings}
			.filteredLocales=${["en", "de"]}
			@change-bundle=${(data: any) => console.info("changeBundle", data.detail.argument)}
			@machine-translate=${(data: any) =>
				console.info("machine translate", JSON.stringify(data.detail.argument))}
			@fix-lint=${(data: any) => console.info("fixLint", data.detail.argument)}
		>
		</inlang-bundle>`
	},
}

export const Complex: StoryObj = {
	render: () => {
		return html`<inlang-bundle
			.bundle=${pluralBundle}
			.settings=${mockSettings}
			.installedLintRules=${mockInstalledLintRules}
			.bundleValidationReports=${mockBundleLintReports}
			.messageValidationReports=${mockMessageLintReports}
			.variantValidationReports=${mockVariantLintReports}
			@update-bundle=${(data: any) => console.info("updateBundle", data.detail.argument)}
			@insert-message=${(data: any) => console.info("insertMessage", data.detail.argument)}
			@update-message=${(data: any) => console.info("updateMessage", data.detail.argument)}
			@delete-message=${(data: any) => console.info("deleteMessage", data.detail.argument)}
			@insert-variant=${(data: any) => console.info("insertVariant", data.detail.argument)}
			@update-variant=${(data: any) => console.info("updateVariant", data.detail.argument)}
			@delete-variant=${(data: any) => console.info("deleteVariant", data.detail.argument)}
			@fix-lint=${(data: any) => console.info("fixLint", data.detail.argument)}
		>
			<inlang-bundle-action
				actionTitle="Share"
				@click=${() => console.log("Share")}
			></inlang-bundle-action>
			<inlang-bundle-action
				actionTitle="Edit alias"
				@click=${() => console.log("Edit alias")}
			></inlang-bundle-action>
		</inlang-bundle> `
	},
}

export const Styled: StoryObj = {
	render: () =>
		html`
			<style>
				.inlang-pattern-editor-contenteditable {
					background-color: #313131 !important;
					color: #e0e0e0 !important;
				}
				.inlang-pattern-editor-contenteditable:hover {
					background-color: #000 !important;
					color: #ffffff !important;
				}
				.inlang-pattern-editor-placeholder {
					color: #e0e0e0;
				}
				inlang-bundle-header::part(base) {
					background-color: #000;
				}

				inlang-bundle-root {
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

				inlang-bundle-action {
					--sl-input-background-color: #313131;
					--sl-input-background-color-hover: #000;
					--sl-input-border-color: #606060;
					--sl-input-color: #e0e0e0;
					--sl-input-color-hover: #ffffff;
				}
			</style>

			<inlang-bundle
				.bundle=${pluralBundle}
				.settings=${mockSettings}
				.lintReports=${[]}
				@change-message-bundle=${(data: any) =>
					console.info("changeMessageBundle", data.detail.argument)}
				@fix-lint=${(data: any) => console.info("fixLint", data.detail.argument)}
			>
				<inlang-bundle-action
					actionTitle="Share"
					@click=${() => console.log("Share")}
				></inlang-bundle-action>
				<inlang-bundle-action
					actionTitle="Edit alias"
					@click=${() => console.log("Edit alias")}
				></inlang-bundle-action>
			</inlang-bundle>
		`,
}

export const ReactiveLints: StoryObj = {
	render: () => {
		return html`<inlang-reactive-wrapper .bundle=${pluralBundle} .settings=${mockSettings}>
		</inlang-reactive-wrapper> `
	},
}
