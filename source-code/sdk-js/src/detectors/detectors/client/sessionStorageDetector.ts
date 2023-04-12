import type { Detector, DetectorInitializer } from "../../types.js"

type DetectorParameters = [string?]

/**
 * Detects the language stored in sessionStorage
 * @param name The name of the key in sessionStorage
 * @returns An Array containing the language stored in sessionStorage.
 */
export const sessionStorageDetector = ((name = "language") =>
	[sessionStorage.getItem(name)].filter(Boolean) as string[]) satisfies Detector<DetectorParameters>

/**
 * Initializes the detector by passing the necessary parameters and returns a detection function without parameters in return
 * @param name The name of the key in sessionStorage
 * @returns An Array containing the language stored in sessionStorage.
 */
export const initSessionStorageDetector = ((name) => () =>
	sessionStorageDetector(name)) satisfies DetectorInitializer<DetectorParameters>
