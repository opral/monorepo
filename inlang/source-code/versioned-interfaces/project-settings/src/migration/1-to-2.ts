import type { ProjectSettings } from "../interface.js";

export const migrate1to2 = (config: any): ProjectSettings => {
  const migrated: ProjectSettings = {
    $schema: "https://inlang.com/schema/project-settings",
    sourceLanguageTag: config.sourceLanguageTag,
    languageTags: config.languageTags,
    modules: config.modules,
  };
  if (config.settings["project.messageLintRuleLevels"]) {
    migrated.messageLintRuleLevels =
      config.settings["project.messageLintRuleLevels"];
  }
  // move keys to root object
  for (const key in config.settings) {
    if (key === "project.messageLintRuleLevels") continue;
    // @ts-expect-error - we know that this is a valid key
    migrated[key] = config.settings[key];
  }
  return migrated;
};
