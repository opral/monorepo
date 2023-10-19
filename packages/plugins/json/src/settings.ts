// pluginOptions for json plugin
import { Type, type Static } from "@sinclair/typebox"

export type PluginSettings = Static<typeof PluginSettings>
export const PluginSettings = Type.Object({
	pathPattern: Type.Union([
		Type.String({
			pattern: "^[^*]*\\{languageTag\\}[^*]*\\.json",
			description: "The PluginSettings must contain `{languageTag}` and end with `.json`.",
		}),
		Type.Record(Type.String(), Type.String()),
	]),
	variableReferencePattern: Type.Optional(Type.Array(Type.String())),
	ignore: Type.Optional(Type.Array(Type.String())),
})

