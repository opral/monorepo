import type { MessageBundle } from "@inlang/sdk/v2"

export const bundleWithoutSelectors: MessageBundle = {
	id: "message-bundle-id",
	messages: [
		{
			id: "message-id-en",
			locale: "en",
			selectors: [],
			declarations: [],
			variants: [
				{
					id: "variant-id-en-*",
					match: [],
					pattern: [{ type: "text", value: "{count} new messages" }],
				},
			],
		},
		{
			id: "message-id-de",
			locale: "de",
			selectors: [],
			declarations: [],
			variants: [
				{
					id: "variant-id-de-*",
					match: [],
					pattern: [{ type: "text", value: "{count} neue Nachrichten" }],
				},
			],
		},
	],
	alias: {},
	// 	default: "frontend_button_text",
	// 	ios: "frontendButtonText",
	// },
}
