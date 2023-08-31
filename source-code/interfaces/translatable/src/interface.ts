import { LanguageTag } from "@inlang/language-tag"
import { Type, TSchema } from "@sinclair/typebox"

/**
 * Translatable type.
 *
 * The language tag `en` is always required. Other language
 * tags are optional. Hence the name "translatable" and not
 * "translated".
 */
export type Translatable<T> = {
	en: T
	[languageTag: LanguageTag]: T
}
export const Translatable = <T extends TSchema>(type: T) =>
	Type.Intersect([Type.Object({ en: type }), Type.Record(LanguageTag, type)])
