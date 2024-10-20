import type { ProjectSettings } from "@inlang/project-settings";

/**
 * Default project settings for createNewProject
 * from paraglide-js/src/cli/commands/init/defaults.ts
 */
export const defaultProjectSettings = {
  $schema: "https://inlang.com/schema/project-settings",
  sourceLanguageTag: "en",
  languageTags: ["en"],
  modules: [
    // for instant gratification, we're adding common rules
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-empty-pattern@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-missing-translation@latest/dist/index.js",
    "https://cdn.jsdelivr.net/npm/@inlang/message-lint-rule-without-source@latest/dist/index.js",

    // default to the message format plugin because it supports all features
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-message-format@latest/dist/index.js",

    // the m function matcher should be installed by default in case Sherlock (VS Code extension) is adopted
    "https://cdn.jsdelivr.net/npm/@inlang/plugin-m-function-matcher@latest/dist/index.js",
  ],
  "plugin.inlang.messageFormat": {
    pathPattern: "./messages/{languageTag}.json",
  },
} satisfies ProjectSettings;
