import type { InlangConfig } from "@inlang/core/config"
import { parse } from "./messageReferenceMatchers.js"
import type { PluginSettings } from "../settings.js"

export const ideExtensionConfig = (settings: PluginSettings): InlangConfig["ideExtension"] => {
	return {
		messageReferenceMatchers: [
			async (args) => {
				return parse(args.documentText, settings)
			},
		],
		extractMessageOptions: [
			{
				callback: (messageId) => `{t("${messageId}")}`,
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
}
