// pluginOptions for json plugin
import { Type, type Static } from "@sinclair/typebox"
const PathPattern = Type.String({
	pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
	title: "Path to language files",
	description:
		"Specify the pathPattern to locate language files in your repository. It must include `{languageTag}` and end with `.json`.",
	examples: [
		"./{languageTag}/file.json",
		"../folder/{languageTag}/file.json",
		"./{languageTag}.json",
	],
})
export type PluginSettings = Static<typeof PluginSettings>
export const PluginSettings = Type.Object({
	pathPattern: Type.Union([
		PathPattern,
		Type.Record(
			Type.String({
				pattern: "^[^.]+$",
				description: "Dots are not allowd ",
				examples: ["website", "app", "homepage"],
			}),
			PathPattern
		),
	]),
	variableReferencePattern: Type.Optional(
		Type.Array(Type.String(), {
			title: "Variable reference pattern",
			description:
				"The pattern to match content in the messages. You can define an opening and closing pattern. The closing pattern is not required. The default is '{{' and '}}'.",
			examples: ["{ and }", "{{ and }}", "< and >", "@:"],
		})
	),
	ignore: Type.Optional(
		Type.Array(Type.String(), {
			title: "Ignore paths",
			description: "Set a path that should be ignored.",
		})
	),
})
