import "./inlang-message-bundle.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"
import {
	multipleMatcherBundle,
	pluralBundle,
	createMockBundleLintReport,
	createMockMessageLintReport,
	createMockVariantLintReport,
} from "@inlang/sdk/v2-mocks"
import { simplifyBundle } from "../helper/simplifyBundle.js"
import { type LintReport, ProjectSettings2, type MessageBundle } from "@inlang/sdk/v2"

const meta: Meta = {
	component: "inlang-message-bundle",
	title: "Public/inlang-message-bundle",
}

const mockMessageLintReports: LintReport[] = [
	createMockBundleLintReport({
		ruleId: "messageBundleLintRule.inlang.missingMessage",
		messageBundleId: "mock_bundle_human_id",
		locale: "de",
		body: "The bundle `mock_bundle_human_id` is missing message for the locale `de`",
	}),
	createMockMessageLintReport({
		ruleId: "messageBundleLintRule.inlang.missingReference",
		messageBundleId: "mock_bundle_human_id",
		messageId: "mock_message_id_en",
		locale: "en",
		body: "The bundle `mock_bundle_human_id` is missing the reference message for the locale `en`",
	}),
	createMockMessageLintReport({
		ruleId: "messageBundleLintRule.inlang.missingReference",
		messageBundleId: "mock_bundle_human_id",
		messageId: "mock_message_id_en",
		locale: "en",
		body: "The bundle `mock_bundle_human_id` is missing the reference message for the locale `en`",
		level: "warning",
	}),
]

const mockVariantLintReports: LintReport[] = [
	createMockVariantLintReport({
		ruleId: "messageBundleLintRule.inlang.missingMessage",
		messageBundleId: "mock_bundle_human_id",
		variantId: "mock_variant_id_de_one",
		locale: "de",
		body: "The variant `one` is broken for the locale `de`",
	}),
]

const mockSettings: ProjectSettings2 = {
	$schema: "https://inlang.com/schema/project-settings",
	baseLocale: "en",
	locales: ["en", "de"],
	lintConfig: [
		{
			ruleId: "messageBundleLintRule.inlang.identicalPattern",
			level: "error",
		},
	],
	modules: [
		"https://cdn.jsdelivr.net/npm/@inlang/plugin-i18next@4/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-identical-pattern@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
		"https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js",
	],
	"plugin.inlang.i18next": {
		pathPattern: {
			brain: "./frontend/public/locales/{languageTag}/brain.json",
			chat: "./frontend/public/locales/{languageTag}/chat.json",
			config: "./frontend/public/locales/{languageTag}/config.json",
			contact: "./frontend/public/locales/{languageTag}/contact.json",
			deleteOrUnsubscribeFormBrain:
				"./frontend/public/locales/{languageTag}/deleteOrUnsubscribeFormBrain.json",
			explore: "./frontend/public/locales/{languageTag}/explore.json",
			external_api_definition:
				"./frontend/public/locales/{languageTag}/external_api_definition.json",
			home: "./frontend/public/locales/{languageTag}/home.json",
			invitation: "./frontend/public/locales/{languageTag}/invitation.json",
			knowledge: "./frontend/public/locales/{languageTag}/knowledge.json",
			login: "./frontend/public/locales/{languageTag}/login.json",
			logout: "./frontend/public/locales/{languageTag}/logout.json",
			monetization: "./frontend/public/locales/{languageTag}/monetization.json",
			translation: "./frontend/public/locales/{languageTag}/translation.json",
			upload: "./frontend/public/locales/{languageTag}/upload.json",
			user: "./frontend/public/locales/{languageTag}/user.json",
		},
	},
}

const simplifiedBundle = simplifyBundle(multipleMatcherBundle)

export default meta

const bundleWithoutSelectors: MessageBundle = {
	id: "message-bundle-id",
	messages: [
		{
			id: "message-id",
			locale: "en",
			selectors: [],
			declarations: [],
			variants: [
				{
					id: "variant-id",
					match: [],
					pattern: [{ type: "text", value: "{count} new messages" }],
				},
			],
		},
	],
	alias: {
		default: "frontend_button_text",
		ios: "frontendButtonText",
	},
}

export const Simple: StoryObj = {
	render: () =>
		html`<inlang-message-bundle
			.messageBundle=${bundleWithoutSelectors}
			.settings=${mockSettings}
			.lintReports=${mockMessageLintReports}
			.filteredLocales=${["en"]}
			@change-message-bundle=${(data: any) =>
				console.info("changeMessageBundle", data.detail.argument)}
			@fix-lint=${(data: any) => console.info("fixLint", data.detail.argument)}
		></inlang-message-bundle> `,
}

export const WithSelectors: StoryObj = {
	render: () =>
		html`<inlang-message-bundle
			.messageBundle=${pluralBundle}
			.settings=${mockSettings}
			.lintReports=${[...mockMessageLintReports, ...mockVariantLintReports]}
			.filteredLocales=${["en"]}
			@change-message-bundle=${(data: any) =>
				console.info("changeMessageBundle", data.detail.argument)}
			@fix-lint=${(data: any) => console.info("fixLint", data.detail.argument)}
		>
		</inlang-message-bundle> `,
}

export const WithSlots: StoryObj = {
	render: () =>
		html`<inlang-message-bundle
			.messageBundle=${bundleWithoutSelectors}
			.settings=${mockSettings}
			.lintReports=${[]}
			@change-message-bundle=${(data: any) =>
				console.info("changeMessageBundle", data.detail.argument)}
			@machine-translate=${(data: any) => console.info("onMachineTranslate", data.detail.argument)}
			@revert=${(data: any) => console.info("onRevert", data.detail.argument)}
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
