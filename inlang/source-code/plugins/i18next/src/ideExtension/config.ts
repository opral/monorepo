import type { PluginSettings } from "../settings.js"
import { parse } from "./messageReferenceMatchers.js"

export const config = {
	messageReferenceMatchers: [
		async (args: { documentText: string; settings: PluginSettings }) => {
			return parse(args.documentText, args.settings)
		},
	],
	extractMessageOptions: [
		{
			callback: (args: { messageId: string }) => ({
				messageId: args.messageId,
				messageReplacement: `{t("${args.messageId}")}`,
			}),
		},
	],
	documentSelectors: [
		{
			language: "typescriptreact",
		},
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
