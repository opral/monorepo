import { Type, Static } from "@sinclair/typebox"

/**
 * Follow the IETF BCP 47 language tag schema.
 *
 * @see https://www.ietf.org/rfc/bcp/bcp47.txt
 * @see https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
 */
// TODO improve typescript type to be a union of all valid language tags https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
export type LanguageTag = Static<typeof LanguageTag>
export const LanguageTag = Type.String()

/**
 * Translated strings for a given language tag.
 *
 * The language tag `en` is always required.
 */
export type TranslatedStrings = Static<typeof TranslatedStrings>
export const TranslatedStrings = Type.Intersect([
	Type.Object({ en: Type.String() }),
	Type.Record(LanguageTag, Type.String()),
])
