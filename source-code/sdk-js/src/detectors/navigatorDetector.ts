import type { Language } from "@inlang/core/ast"
import type { DetectorTemplate, InitDetector } from "./types.js"

type ObjectWithNavigatorLanguages = {
	navigator: { languages: readonly Language[] }
}

type DetectorParameters = [{ window: ObjectWithNavigatorLanguages }]

/**
 * Detects an array of languages based on the user preferences stored in window.navigator.languages
 * @param parameters The function parameters
 * @param parameters.window The window object (https://developer.mozilla.org/en-US/docs/Web/API/Window)
 * @returns An Array of strings representing the users preferred languages ordered after preference.
 */

export const navigatorDetectorTemplate = (({ window }) => [
	...window.navigator.languages,
]) satisfies DetectorTemplate<DetectorParameters>

/**
 * Initializes the detector by passing the necessary parameters and returns a detection function without parameters in return
 * @param parameters The function parameters
 * @param parameters.window The window object (https://developer.mozilla.org/en-US/docs/Web/API/Window)
 * @returns A detection function that takes no parameters and returns an array of strings representing the users preferred languages ordered after preference.
 */

export const initNavigatorDetector = (({ window }) =>
	() =>
		navigatorDetectorTemplate({ window })) satisfies InitDetector<DetectorParameters>
