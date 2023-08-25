import type { PluginSettings } from "../settings.js"
import { parse } from "./messageReferenceMatchers.js"
import type { IdeExtensionConfig, Plugin } from "@inlang/app"

export const ideExtensionConfig =
	(settings: PluginSettings): Plugin["addAppSpecificApi"] =>
	() => ({
		"inlang.app.ideExtension": {
			messageReferenceMatchers: [
				async (args: { documentText: string }) => {
					return parse(args.documentText, settings)
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
