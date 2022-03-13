import { languageCodes } from '../variables/languageCodes';

/**
 * Iso 639-1 language code.
 *
 * https://www.iso.org/standard/22109.html
 */
export type LanguageCode = typeof languageCodes[number];
