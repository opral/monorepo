// pluginOptions for json plugin
import { Type, type Static } from "@sinclair/typebox"
const PathPattern = Type.String({
	pattern: "^[^*]*\\{languageTag\\}[^*]*\\.json",
	description: "The pathPattern must contain `{languageTag}` and end with `.json`.",
	examples: [
		"{languageTag}/examplerfile.json",
		"examplerFolder/{languageTag}/ExamplePath.json",
		"examplerFolder/ExamplePath{languageTag}ExamplePath.json",
	],
})
export type PluginSettings = Static<typeof PluginSettings>
export const PluginSettings = Type.Object({
	pathPattern: Type.Union([PathPattern, Type.Record(Type.String(), PathPattern)]),
	variableReferencePattern: Type.Optional(Type.Array(Type.String())),
	ignore: Type.Optional(Type.Array(Type.String())),
})



