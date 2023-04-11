export type { Detector, DetectorInitializer } from "./types.js"
export { detectLanguage } from "./detectLanguage.js"

export {
	initAcceptLanguageHeaderDetector,
	acceptLanguageHeaderDetector,
} from "./detectors/server/acceptLanguageHeaderDetector.js"
export { navigatorDetector } from "./detectors/client/navigatorDetector.js"
export { initLocalStorageDetector, localStorageDetector } from "./detectors/client/localStorageDetector.js"
export { initRootSlugDetector, rootSlugDetector } from "./detectors/shared/rootSlugDetector.js"
