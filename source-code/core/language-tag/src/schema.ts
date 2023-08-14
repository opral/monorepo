import { Type, Static, TSchema } from "@sinclair/typebox"

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
 * Content for a language tag.
 *
 * The language tag `en` is always required.
 */
export type WithLanguageTags<T> = {
	en: T
	[languageTag: string]: T
}
export const WithLanguageTags = <T extends TSchema>(type: T) =>
	Type.Intersect([Type.Object({ en: type }), Type.Record(LanguageTag, type)])
