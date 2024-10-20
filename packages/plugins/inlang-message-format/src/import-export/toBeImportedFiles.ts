import { PLUGIN_KEY, type plugin } from "../plugin.js";

export const toBeImportedFiles: NonNullable<
  (typeof plugin)["toBeImportedFiles"]
> = async ({ settings }) => {
  const result = [];
  const pathPattern = settings[PLUGIN_KEY]?.pathPattern;
  if (pathPattern === undefined) {
    return [];
  }
  for (const locale of settings.locales) {
    result.push({
      locale,
      path: pathPattern.replace(/{(locale|languageTag)}/, locale),
    });
  }
  return result;
};
