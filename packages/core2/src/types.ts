import type { LanguageTag } from "./languageTag.js"
/**
 * Translated strings for a given language tag.
 *
 * The language tag `en` is always required.
 */
export type TranslatedStrings = Record<LanguageTag, string> & { en: string }
