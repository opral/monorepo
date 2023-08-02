import { parse } from "./messageReferenceMatchers.js"
import type { Plugin } from "@inlang/plugin"

export const ideExtensionConfig = (): Plugin["addAppSpecificApi"] => () => ({
	"inlang.ide-extension": {
		messageReferenceMatchers: [
			async (sourceCode: string) => {
				return parse(sourceCode)
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
