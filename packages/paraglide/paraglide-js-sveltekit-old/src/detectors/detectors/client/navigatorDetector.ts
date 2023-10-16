import type { Detector } from "../../types.js"

/**
 * Detects an array of languageTags based on the user preferences stored in window.navigator.languageTags
 * @returns An Array of strings representing the users preferred languageTags ordered after preference.
 */
export const navigatorDetector = (() => [...window.navigator.languages]) satisfies Detector
