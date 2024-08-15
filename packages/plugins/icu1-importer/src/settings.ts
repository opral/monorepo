import { Type, type Static, } from "@sinclair/typebox"

export type PluginSettings = Static<typeof PluginSettings>
export const PluginSettings = 
	Type.Object({
		messagesFolderPath:Type.String({
			pattern: ".*",
			examples: ["./messages", "./i18n"],
			title: "Path to folder containing language files",
			description:
				"The relative path to the folder containing the language files in your repository. It must contain files named `{locale}.json`.",
		}),
)
