// pluginOptions for json plugin
import { Type, type Static } from "@sinclair/typebox"
const PathPattern = Type.String({
	pattern: "^(\\./|\\../|/)[^*]*\\{languageTag\\}[^*]*\\.json",
	description: "The pathPattern must contain `{languageTag}` and end with `.json`.",
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
	variableReferencePattern: Type.Optional(Type.Array(Type.String())),
	ignore: Type.Optional(Type.Array(Type.String())),
})
