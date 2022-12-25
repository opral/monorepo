import type { iso639Codes } from "./iso639.js";

/**
 * ISO 639-1 language code to identify a human language.
 *
 * https://en.wikipedia.org/wiki/List_of_ISO_639-1_codes
 */
export type Iso639LanguageCode = typeof iso639Codes[number];
