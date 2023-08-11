import type { PluginSettings } from "../settings.js"
import { parse } from "./messageReferenceMatchers.js"
import type { Plugin } from "@inlang/plugin"

export const ideExtensionConfig =
	(settings: PluginSettings): Plugin["addAppSpecificApi"] =>
	() => ({
		"inlang.app.ideExtension": {
			messageReferenceMatchers: [
				async (sourceCode: string) => {
					return parse(sourceCode, settings)
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
		},
	})
