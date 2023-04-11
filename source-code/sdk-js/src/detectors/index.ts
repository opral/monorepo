export type { Detector, DetectorInitializer } from "./types.js"
export { detectLanguage } from "./detectLanguage.js"

export { initAcceptLanguageHeaderDetector } from "./detectors/server/acceptLanguageHeaderDetector.js"
export { navigatorDetector } from "./detectors/client/navigatorDetector.js"
export { initLocalStorageDetector, localStorageDetector } from "./detectors/client/localStorageDetector.js"
export { initSessionStorageDetector, sessionStorageDetector } from "./detectors/client/sessionStorageDetector.js"
export { initRootSlugDetector } from "./detectors/shared/rootSlugDetector.js"
