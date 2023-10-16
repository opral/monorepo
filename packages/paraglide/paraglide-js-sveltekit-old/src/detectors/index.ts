export type { Detector, DetectorInitializer } from "./types.js"
import { detectLanguageTag } from "./detectLanguageTag.js"

/** @deprecated Use `detectLanguageTag` instead. */
const detectLanguage = detectLanguageTag

export { detectLanguageTag, detectLanguage }
