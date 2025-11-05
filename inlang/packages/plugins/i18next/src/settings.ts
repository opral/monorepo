// Settings for i18next plugin
import { Type, type Static } from "@sinclair/typebox";

const PathPattern = Type.String({
	pattern: "^(\\./|\\../|/)[^*]*\\{(languageTag|locale)\\}[^*]*\\.json$",
	title: "Path to language files",
	description:
		"Specify the pathPattern to locate language files in your repository. It must include `{locale}` and end with `.json`.",
	examples: [
		"./{locale}/file.json",
		"../folder/{locale}/file.json",
		"./{locale}.json",
	],
});
const NameSpacePathPattern = Type.Record(
	Type.String({
		pattern: "^[^.]+$",
		description: "Dots are not allowd ",
		examples: ["website", "app", "homepage"],
	}),
	PathPattern
);

export type PluginSettings = Static<typeof PluginSettings>;
export const PluginSettings = Type.Object({
	pathPattern: Type.Union([PathPattern, NameSpacePathPattern]),
	variableReferencePattern: Type.Optional(
		Type.Array(Type.String(), {
			title: "Variable reference pattern",
			description:
				"The pattern to match content in the messages. You can define an opening and closing pattern. The closing pattern is not required. The default is '{{' and '}}'.",
			examples: ["{ and }", "{{ and }}", "< and >", "@:"],
		})
	),
	sourceLanguageFilePath: Type.Optional(
		Type.Union([PathPattern, NameSpacePathPattern], {
			title: "Source language file path",
			description:
				"Sometimes it is necessary to specify the location of the source language file(s) when they do not follow the standard naming or file structure convention.",
		})
	),
	ignore: Type.Optional(
		Type.Array(Type.String(), {
			title: "Ignore paths",
			description: "Set a path that should be ignored.",
		})
	),
});
