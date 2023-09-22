import { Type, type Static } from "@sinclair/typebox"

/**
 * Follows the IETF BCP 47 language tag schema.
 *
 * // TODO: add (regex) validation
 *
 * @see https://www.ietf.org/rfc/bcp/bcp47.txt
 * @see https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
 */
export type LanguageTag = Static<typeof LanguageTag>
export const LanguageTag = Type.String()
