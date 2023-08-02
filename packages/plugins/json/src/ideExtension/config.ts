import type { Plugin } from "@inlang/plugin"
import { parse } from "./messageReferenceMatchers.js"

export const ideExtensionConfig: Plugin["addAppSpecificApi"] = () => ({
	"inlang.ide-extension": {
		messageReferenceMatchers: [
			async (args) => {
				return parse(args.documentText)
			},
		],
		extractMessageOptions: [
			{
				callback: (messageId: string) => `{t("${messageId}")}`,
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
})