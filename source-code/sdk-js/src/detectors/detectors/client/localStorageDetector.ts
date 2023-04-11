import type { Detector, DetectorInitializer } from "../../types.js"

type DetectorParameters = [string?]

export const localStorageDetector = ((name = 'language') => [localStorage.getItem(name)].filter(Boolean) as string[]) satisfies Detector<DetectorParameters>

export const initLocalStorageDetector = ((name) => () => localStorageDetector(name)) satisfies DetectorInitializer<DetectorParameters>
