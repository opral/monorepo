import "./inlang-message-bundle.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"
import { multipleMatcherBundle } from "@inlang/sdk/v2-mocks"
import { simplifyBundle } from "../helper/simplifyBundle.js"
import { createMessage, type MessageBundle } from "@inlang/sdk/v2"
import type { MessageLintReport } from "@inlang/message-lint-rule"

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

const simplifiedBundle = simplifyBundle(multipleMatcherBundle)

export default meta

export const Props: StoryObj = {
	render: () =>
		html`<inlang-message-bundle
			.messageBundle=${simplifiedBundle}
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
			.lintReports=${mockLintReports}
			@change-message-bundle=${(messageBundle: MessageBundle) =>
				console.info("changeMessageBundle", messageBundle)}
		></inlang-message-bundle> `,
}
