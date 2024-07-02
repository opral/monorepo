import "./inlang-message-bundle.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"
import { multipleMatcherBundle, pluralBundle } from "@inlang/sdk/v2-mocks"
import { simplifyBundle } from "../helper/simplifyBundle.js"
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
}

export default meta

export const Simple: StoryObj = {
	render: () =>
		html`<inlang-message-bundle
			.messageBundle=${bundleWithoutSelectors}
			.settings=${mockSettings}
			.lintReports=${mockMessageLintReports}
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
			.lintReports=${[...mockMessageLintReports, ...mockVariantLintReports]}
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
