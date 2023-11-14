import { parse } from "./messageReferenceMatchers.js"
import type { Plugin } from "@inlang/plugin"

export const ideExtensionConfig = (): ReturnType<Exclude<Plugin["addCustomApi"], undefined>> => ({
	"app.inlang.ideExtension": {
		messageReferenceMatchers: [
			async (args: { documentText: string }) => {
				return parse(args.documentText)
			},
		],
		extractMessageOptions: [
			{
				callback: (args: { messageId: string }) => {
					const messageId = transformMessageId(args.messageId)
					return {
						messageId,
						messageReplacement: `{m.${messageId}()}`,
					}
				},
			},
			{
				callback: (args: { messageId: string }) => {
					const messageId = transformMessageId(args.messageId)
					return {
						messageId,
						messageReplacement: `m.${messageId}()`,
					}
				},
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
			{
				language: "vue",
			},
		],
	},
})

function transformMessageId(messageId: string): string {
	return messageId
		.trim()
		.replace(/[^a-zA-Z0-9\s_.]/g, "")
		.replace(/[\s.]+/g, "_")
}
