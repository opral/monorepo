import { parse } from "./messageReferenceMatchers.js"
import type { IdeExtensionConfig, Plugin } from "@inlang/sdk"

export const ideExtensionConfig = (): Plugin["addAppSpecificApi"] => () => ({
	"inlang.app.ideExtension": {
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
	} satisfies IdeExtensionConfig,
})
