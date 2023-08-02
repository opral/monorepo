import { parse } from "./messageReferenceMatchers.js"
import type { PluginOptions } from "../options.js"
import type { Plugin } from "@inlang/plugin"

export const ideExtensionConfig = (options: PluginOptions): Plugin["addAppSpecificApi"] => () => ({
	"inlang.ideExtesion": {
		messageReferenceMatchers: [
			async (args) => {
				return parse(args.documentText, options)
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
