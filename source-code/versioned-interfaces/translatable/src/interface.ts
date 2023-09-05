import { LanguageTag } from "@inlang/language-tag"
import { Type, type TString, type TTemplateLiteral } from "@sinclair/typebox"

/**
 * Translatable type.
 *
 * - The translatable type is designed to be incrementally adoptable.
 *
 * - Thus, it is possible to use the type in a translatable object
 * or directly as a string.
 *
 * - If an object is provided, the language tag `en` is always required
 * as a fallback. Other language tags are optional.
 *
 * - A translatable value can only be a string for now. In the future,
 * we might add support for other types.
 *
 * @example
 *
 *   import { Translatable, translationFor } from "@inlang/translatable"
 *
 *   const translatable1: Translatable<string> = "Hello world"
 *   const translatable2: Translatable<string> = {
 * 	 		en: "Hello world",
 *      de: "Hallo Welt",
 *   }
 *
 *   translationFor("en", translatable1) // "Hello world"
 *   translationFor("en", translatable2) // "Hello world"
 *   translationFor("de", translatable2) // "Hallo Welt"
 *
 */
export type Translatable<T extends string> =
	| T
	| {
			en: T
			[languageTag: LanguageTag]: T
	  }
export const Translatable = <T extends TString | TTemplateLiteral>(type: T) =>
	Type.Union([type, Type.Intersect([Type.Object({ en: type }), Type.Record(LanguageTag, type)])])
