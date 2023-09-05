import { parse } from "./messageReferenceMatchers.js"
import type { CustomApiInlangIdeExtension, Plugin } from "@inlang/sdk"

export const ideExtensionConfig = (): ReturnType<Exclude<Plugin["addCustomApi"], undefined>> => ({
	"app.inlang.ideExtension": {
		messageReferenceMatchers: [
			async (args: { documentText: string }) => {
				return parse(args.documentText)
			},
		],
		extractMessageOptions: [
			{
				callback: (args: { messageId: string }) => `{t("${args.messageId}")}`,
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
	} satisfies CustomApiInlangIdeExtension,
})
