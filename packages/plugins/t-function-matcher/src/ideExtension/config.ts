import { parse } from "./messageReferenceMatchers.js"
import type { CustomApiInlangIdeExtension, Plugin } from "@inlang/plugin"

export const ideExtensionConfig = (): ReturnType<Exclude<Plugin["addCustomApi"], undefined>> => ({
	"app.inlang.ideExtension": {
		messageReferenceMatchers: [
			async (args: { documentText: string }) => {
				return parse(args.documentText)
			},
		],
		extractMessageOptions: [
			{
				callback: (args: { messageId: string }) => ({
					messageId: args.messageId,
					messageReplacement: `{t("${args.messageId}")}`,
				}),
			},
			{
				callback: (args: { messageId: string }) => ({
					messageId: args.messageId,
					messageReplacement: `t("${args.messageId}")`,
				}),
			},
			{
				callback: (args: { messageId: string }) => ({
					messageId: args.messageId,
					messageReplacement: args.messageId,
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
			{
				language: "astro",
			},
			{
				language: "vue",
			},
		],
	} satisfies CustomApiInlangIdeExtension,
})
