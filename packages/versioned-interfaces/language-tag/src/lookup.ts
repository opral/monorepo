import type { LanguageTag } from "./interface.js";

type LookupOptions = {
  languageTags: LanguageTag[];
  defaultLanguageTag: LanguageTag;
};

/**
 * Performs a lookup for the given language tag, among the available language tags,
 * according to the IETF BCP 47 spec.
 *
 * It **does not support Wildcards** at the moment.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc4647#section-3.4
 */
export function lookup(
  languageTag: LanguageTag,
  options: LookupOptions,
): LanguageTag {
  const fallbackLanguages: LanguageTag[] = [];

  const languageTagParts = languageTag.split("-").filter(Boolean);
  for (let i = languageTagParts.length; i > 0; i--) {
    //Skip the x separator
    if (languageTagParts[i - 1] === "x") continue;

    //Stringify the language tag parts
    const fallbackLanguageTag = languageTagParts.slice(0, i).join("-");
    if (!options.languageTags.includes(fallbackLanguageTag)) continue;
    fallbackLanguages.push(fallbackLanguageTag);
  }

  return fallbackLanguages[0] ?? options.defaultLanguageTag;
}
