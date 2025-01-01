// @ts-nocheck

import { Type, type Static } from "@sinclair/typebox";

export type PluginSettings = Static<typeof PluginSettings>;
export const PluginSettings = Type.Object({
  pathPattern: Type.String({
    pattern: ".*\\{locale\\}.*\\.json$",
    examples: ["./messages/{locale}.json", "./i18n/{locale}.json"],
    title: "Path to language files",
    description:
      "Specify the pathPattern to locate language files in your repository. It must include `{locale}` and end with `.json`.",
  }),
});
