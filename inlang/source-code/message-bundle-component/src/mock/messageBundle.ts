import type { MessageBundle } from "@inlang/sdk/v2"

export const bundleWithoutSelectors: MessageBundle = {
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
