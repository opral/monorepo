import {
  sourceLanguageTag,
  availableLanguageTags,
  languageTag,
} from "#src/paraglide/runtime.js";

export const renderLocales = (path: string) => {
  const locales = availableLanguageTags.map((tag) => {
    return {
      href: `https://inlang.com${tag === sourceLanguageTag ? "" : "/" + tag}${path
        .replace(`/${languageTag()}`, "")
        .replace(/\/$/, "")}`,
      hreflang: tag,
      rel: "alternate",
    };
  });
  return locales;
};
