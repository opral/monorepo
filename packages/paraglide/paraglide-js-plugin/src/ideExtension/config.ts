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
				callback: (args: { messageId: string }) =>
					`{m.${args.messageId.trim().replace(/\s+/g, "_").toLowerCase()}()}`,
			},
			{
				callback: (args: { messageId: string }) =>
					`m.${args.messageId.trim().replace(/\s+/g, "_").toLowerCase()}()`,
			},
			{
				callback: (args: { messageId: string }) =>
					`{m.${args.messageId
						.trim()
						.replace(/\s+(.)/g, (_, match) => match.toUpperCase())
						.replace(/\s+/g, "")}()}`,
			},
			{
				callback: (args: { messageId: string }) =>
					`m.${args.messageId
						.trim()
						.replace(/\s+(.)/g, (_, match) => match.toUpperCase())
						.replace(/\s+/g, "")}()`,
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
	},
})
