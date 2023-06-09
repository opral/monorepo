import type { InlangConfig } from "@inlang/core/config"

export const ideExtensionConfig: InlangConfig["ideExtension"] = {
	messageReferenceMatchers: [
		async (args) => {
			const { parse } = await import("./messageReferenceMatchers.js")
			return parse(args.documentText)
		},
	],
	extractMessageOptions: [
		{
			callback: (messageId) => `{t("${messageId}")}`,
		},
	],
	documentSelectors: [
		{
			language: "javascript",
		},
		{
			language: "typescript",
		},
		{
			language: "svelte",
		},
	],
}
