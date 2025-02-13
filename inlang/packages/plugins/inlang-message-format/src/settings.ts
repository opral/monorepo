import { Type, type Static } from "@sinclair/typebox";

const pathPatternString = Type.String({
  // for legacy reasons locale can be specified as well
  pattern: ".*\\{(languageTag|locale)\\}.*\\.json$",
  examples: ["./messages/{languageTag}.json", "./i18n/{languageTag}.json"],
  title: "Path to language files",
  description:
    "Specify the pathPattern to locate resource files in your repository. It must include `{languageTag}` and end with `.json`.",
});

const pathPatternArray = Type.Array(pathPatternString, {
  title: "Paths to language files",
  description:
    "Specify multiple pathPatterns to locate resource files in your repository. Each must include `{languageTag}` and end with `.json`.",
});

export type PluginSettings = Static<typeof PluginSettings>;
export const PluginSettings = Type.Object({
  pathPattern: Type.Union([pathPatternString, pathPatternArray]),
});
