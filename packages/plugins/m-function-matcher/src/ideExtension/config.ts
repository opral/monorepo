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
				callback: (args: { messageId: string }) => ({
					messageId: args.messageId
						.trim()
						.replace(/[^a-zA-Z0-9\s_.]/g, "")
						.replace(/[\s.]+/g, "_"),
					messageReplacement: `{m.${args.messageId
						.trim()
						.replace(/[^a-zA-Z0-9\s_.]/g, "")
						.replace(/[\s.]+/g, "_")}()}`,
				}),
			},
			{
				callback: (args: { messageId: string }) => ({
					messageId: args.messageId
						.trim()
						.replace(/[^a-zA-Z0-9\s_.]/g, "")
						.replace(/[\s.]+/g, "_"),
					messageReplacement: `m.${args.messageId
						.trim()
						.replace(/[^a-zA-Z0-9\s_.]/g, "")
						.replace(/[\s.]+/g, "_")}()`,
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
				language: "vue",
			},
		],
	},
})
