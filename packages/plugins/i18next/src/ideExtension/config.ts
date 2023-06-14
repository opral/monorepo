import type { InlangConfig } from "@inlang/core/config"
import { parse } from "./messageReferenceMatchers.parsimmon.js"

export const ideExtensionConfig: InlangConfig["ideExtension"] = {
	messageReferenceMatchers: [
		async (args) => {
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
