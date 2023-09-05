export { migrateProjectConfig } from "./migrate.js"
export { createProjectConfig } from "./create.js"
export { getLanguageFolderPath } from "./getLanguageFolderPath.js"
export { getSupportedLibrary } from "./tryAutoGenModuleConfig.js"

export type { SupportedLibrary } from "./tryAutoGenModuleConfig.js"
// TODO:
// - handle auto get versions
// refactor logic fetch, join functions (join part of lix, or make fs only normalized to unix logic?)
// - abort if git not clean?
// - check and implement config options for other plugins
// - check and implement other lint rules?
// Support pathPattern object format
// 		"pathPattern": {
// 			"client-page": "app/i18n/locales/{languageTag}/client-page.json",
// 			"footer": "app/i18n/locales/{languageTag}/footer.json",
// 			"second-page": "app/i18n/locales/{languageTag}/second-page.json",
// 			"translation": "app/i18n/locales/{languageTag}/translation.json"
// 		}
// cli: console.info(`✅ Supported library found: ${pluginName}`)
