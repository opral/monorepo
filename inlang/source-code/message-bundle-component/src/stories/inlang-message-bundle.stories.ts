import "./inlang-message-bundle.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"
import { multipleMatcherBundle, pluralBundle } from "@inlang/sdk/v2-mocks"
import { simplifyBundle } from "../helper/simplifyBundle.js"
import { createMessage, type MessageBundle } from "@inlang/sdk/v2"
import type { MessageLintReport } from "@inlang/message-lint-rule"
import { ProjectSettings } from "@inlang/sdk"

const meta: Meta = {
	component: "inlang-message-bundle",
	title: "Public/inlang-message-bundle",
}

const mockLintReports: MessageLintReport[] = [
	{
		ruleId: "messageLintRule.inlang.missingTranslation",
		messageId: "message-id",
		languageTag: "de",
		body: "test message",
		level: "error",
	},
]

const mockSettings: ProjectSettings = {
	$schema: "https://inlang.com/schema/project-settings",
	sourceLanguageTag: "en",
	languageTags: ["en", "de", "nl"],
	messageLintRuleLevels: {
		"messageLintRule.inlang.identicalPattern": "error",
	},
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

export const Props: StoryObj = {
	render: () =>
		html`<inlang-message-bundle
			.messageBundle=${simplifiedBundle}
			.settings=${mockSettings}
			.lintReports=${mockLintReports}
			@change-message-bundle=${(messageBundle: MessageBundle) =>
				console.info("changeMessageBundle", messageBundle)}
		></inlang-message-bundle> `,
}

const bundleWithoutSelectors: MessageBundle = {
	id: "message-bundle-id",
	messages: [
		createMessage({ locale: "en", text: "Hello World!" }),
		createMessage({ locale: "de", text: "Hallo Welt!" }),
	],
	alias: {
		default: "alias",
	},
}

export const Simple: StoryObj = {
	render: () =>
		html`<inlang-message-bundle
			.messageBundle=${bundleWithoutSelectors}
			.settings=${mockSettings}
			.lintReports=${mockLintReports}
			@change-message-bundle=${(messageBundle: MessageBundle) =>
				console.info("changeMessageBundle", messageBundle)}
		></inlang-message-bundle> `,
}

export const WithSelectors: StoryObj = {
	render: () =>
		html`<inlang-message-bundle
			.messageBundle=${pluralBundle}
			.settings=${mockSettings}
			.lintReports=${mockLintReports}
			@change-message-bundle=${(messageBundle: MessageBundle) =>
				console.info("changeMessageBundle", messageBundle)}
		></inlang-message-bundle> `,
}
