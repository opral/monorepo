import "./inlang-message-bundle.ts"
import type { Meta, StoryObj } from "@storybook/web-components"
import { html } from "lit"
import { multipleMatcherBundle } from "@inlang/sdk/v2-mocks"
import { simplifyBundle } from "../helper/simplifyBundle.js"
import type { MessageBundle } from "@inlang/sdk/v2"

const meta: Meta = {
	component: "inlang-message-bundle",
	title: "Public/inlang-message-bundle",
}

const simplifiedBundle = simplifyBundle(multipleMatcherBundle)

export default meta

export const Props: StoryObj = {
	render: () =>
		html`<inlang-message-bundle
			.messageBundle=${simplifiedBundle}
			@change-message-bundle=${(messageBundle: MessageBundle) =>
				console.info("changeMessageBundle", messageBundle)}
		></inlang-message-bundle> `,
}
