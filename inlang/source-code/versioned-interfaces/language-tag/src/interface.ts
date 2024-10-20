import { Type, type Static } from "@sinclair/typebox";

/**
 * Follows the IETF BCP 47 language tag schema.
 *
 * @see https://www.ietf.org/rfc/bcp/bcp47.txt
 * @see https://www.iana.org/assignments/language-subtag-registry/language-subtag-registry
 */
export type LanguageTag = Static<typeof LanguageTag>;
/**
 * Follows the IETF BCP 47 language tag schema with modifications.
 * @see REAMDE.md file for more information on the validation.
 */

export const pattern =
  "^((?<grandfathered>(en-GB-oed|i-ami|i-bnn|i-default|i-enochian|i-hak|i-klingon|i-lux|i-mingo|i-navajo|i-pwn|i-tao|i-tay|i-tsu|sgn-BE-FR|sgn-BE-NL|sgn-CH-DE)|(art-lojban|cel-gaulish|no-bok|no-nyn|zh-guoyu|zh-hakka|zh-min|zh-min-nan|zh-xiang))|((?<language>([A-Za-z]{2,3}(-(?<extlang>[A-Za-z]{3}(-[A-Za-z]{3}){0,2}))?))(-(?<script>[A-Za-z]{4}))?(-(?<region>[A-Za-z]{2}|[0-9]{3}))?(-(?<variant>[A-Za-z0-9]{5,8}|[0-9][A-Za-z0-9]{3}))*))$";

export const LanguageTag = Type.String({
  pattern: pattern,
  description: "The language tag must be a valid IETF BCP 47 language tag.",
  examples: ["en", "de", "en-US", "zh-Hans", "es-419"],
});
