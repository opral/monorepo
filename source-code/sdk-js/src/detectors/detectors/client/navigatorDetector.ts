import type { Detector } from "../../types.js"

/**
 * Detects an array of languages based on the user preferences stored in window.navigator.languages
 * @returns An Array of strings representing the users preferred languages ordered after preference.
 */
export const navigatorDetector = (() => [...window.navigator.languages]) satisfies Detector
