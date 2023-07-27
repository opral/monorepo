import type { LanguageTag } from "./types.js"
import { z } from "zod"

/**
 * Translated strings for a given language tag.
 *
 * The language tag `en` is always required.
 */
export type TranslatedStrings = Record<LanguageTag, string> & { en: string }

export const TranslatedStrings = z.intersection(z.object({ en: z.string() }), z.record(z.string()))
