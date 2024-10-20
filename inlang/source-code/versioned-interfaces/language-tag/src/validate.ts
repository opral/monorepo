import { pattern } from "./interface.js";

export const isValidLanguageTag = (languageTag: string): boolean =>
  RegExp(`${pattern}`).test(languageTag);
